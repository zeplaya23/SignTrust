package ci.cryptoneo.signtrust.signature;

import io.quarkus.arc.properties.IfBuildProperty;
import jakarta.enterprise.context.ApplicationScoped;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.SignatureInterface;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.SignatureOptions;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.visible.PDVisibleSigProperties;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.visible.PDVisibleSignDesigner;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Calendar;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Real PAdES signature using Augura Signing Service Remote API.
 *
 * Uses PDFBox's high-level PDVisibleSignDesigner/PDVisibleSigProperties API
 * to create a proper visible signature field with the drawn signature image
 * as appearance. The cryptographic CMS is obtained via remote signing (hash only).
 *
 * Flow:
 * 1. POST /api/remote/prepare → session_id
 * 2. PDVisibleSignDesigner builds visible signature field at correct position
 * 3. PDFBox computes byte range; SHA-256 hash sent to POST /api/remote/sign → CMS
 * 4. CMS embedded in the signature field
 * 5. POST /api/remote/extend → PAdES_BASELINE_LT
 */
@ApplicationScoped
@IfBuildProperty(name = "signtrust.signing.mode", stringValue = "augura")
public class ApplicationSignatureService implements SignatureService {

    private static final Logger LOG = Logger.getLogger(ApplicationSignatureService.class);

    @ConfigProperty(name = "signtrust.signing.url", defaultValue = "http://trust-signing-service:3000")
    String signingBaseUrl;

    @ConfigProperty(name = "signtrust.signing.username", defaultValue = "admin")
    String signingUsername;

    @ConfigProperty(name = "signtrust.signing.password", defaultValue = "admin")
    String signingPassword;

    @ConfigProperty(name = "signtrust.signing.organization", defaultValue = "Cryptoneo")
    String signingOrganization;

    @ConfigProperty(name = "signtrust.signing.country", defaultValue = "CI")
    String signingCountry;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .sslContext(createTrustAllSslContext())
            .build();

    private volatile String accessToken;
    private volatile Instant tokenExpiry = Instant.EPOCH;

    @Override
    public byte[] signPdf(byte[] pdfContent, String signerName, String signerEmail, String location,
                          byte[] signatureImage, int pageNumber, double xPct, double yPct,
                          double widthPct, double heightPct) {
        try {
            String token = getAccessToken();

            // Phase 1: Prepare — get session ID + certificate chain from signing service
            ObjectNode prepareBody = mapper.createObjectNode();
            prepareBody.put("signer_name", signerName);
            prepareBody.put("signer_organization", signingOrganization);
            prepareBody.put("signer_country", signingCountry);

            JsonNode prepareResp = postJson(token, "/api/remote/prepare", prepareBody);
            String sessionId = prepareResp.get("session_id").asText();
            String signerDn = prepareResp.has("signer_dn") ? prepareResp.get("signer_dn").asText() : signerName;

            // Capture certificate + chain for validation-data call later
            String signerCertB64 = prepareResp.has("certificate") ? prepareResp.get("certificate").asText() : null;
            java.util.List<String> chainB64 = new java.util.ArrayList<>();
            if (signerCertB64 != null) {
                chainB64.add(signerCertB64);
            }
            if (prepareResp.has("chain")) {
                for (JsonNode certNode : prepareResp.get("chain")) {
                    chainB64.add(certNode.asText());
                }
            }

            LOG.infof("Remote signing session prepared: session_id=%s, signer_dn=%s, chain_certs=%d",
                    sessionId, signerDn, chainB64.size());

            // Phase 2: Create visible signature field + sign via remote hash
            ByteArrayOutputStream signedOutput = new ByteArrayOutputStream();

            try (PDDocument doc = Loader.loadPDF(pdfContent)) {
                int pageIdx = Math.max(0, Math.min(pageNumber - 1, doc.getNumberOfPages() - 1));
                PDPage page = doc.getPage(pageIdx);
                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();

                // Convert percentages to PDF points
                float xPts = (float) (xPct / 100.0 * pageWidth);
                float yPts = (float) (yPct / 100.0 * pageHeight);
                float wPts = (float) (widthPct / 100.0 * pageWidth);
                float hPts = (float) (heightPct / 100.0 * pageHeight);

                PDSignature signature = new PDSignature();
                signature.setFilter(PDSignature.FILTER_ADOBE_PPKLITE);
                signature.setSubFilter(PDSignature.SUBFILTER_ETSI_CADES_DETACHED);
                signature.setName(signerDn);
                signature.setReason("Signed by " + signerName);
                signature.setLocation(location);
                signature.setSignDate(Calendar.getInstance());

                try (SignatureOptions options = new SignatureOptions()) {
                    options.setPreferredSignatureSize(32768);
                    options.setPage(pageIdx);

                    if (signatureImage != null && signatureImage.length > 0) {
                        // Image is already drawn at the correct field proportions (no trim needed)
                        PDVisibleSignDesigner visibleDesigner = new PDVisibleSignDesigner(
                                doc, new ByteArrayInputStream(signatureImage), pageNumber);
                        visibleDesigner
                                .xAxis(xPts)
                                .yAxis(yPts)
                                .width(wPts)
                                .height(hPts)
                                .signatureFieldName("Sig_" + signerName.replaceAll("[^a-zA-Z0-9]", "_"));

                        PDVisibleSigProperties visibleProps = new PDVisibleSigProperties();
                        visibleProps
                                .signerName(signerDn)
                                .signerLocation(location)
                                .signatureReason("Signed by " + signerName)
                                .page(pageIdx)
                                .visualSignEnabled(true)
                                .setPdVisibleSignature(visibleDesigner);
                        visibleProps.buildSignature();

                        options.setVisualSignature(visibleProps);
                    }

                    RemoteSignatureInterface remoteSign = new RemoteSignatureInterface(sessionId, token);
                    doc.addSignature(signature, remoteSign, options);
                    doc.saveIncremental(signedOutput);
                }
            }

            byte[] signedPdf = signedOutput.toByteArray();

            // Phase 3: Build DSS locally using validation-data endpoint (like Remote-jsapp-Client)
            signedPdf = buildLocalDss(signedPdf, chainB64, token);

            LOG.infof("PDF signed with visible field at page %d (%.1f%%, %.1f%%) size (%.1f%%x%.1f%%) for %s",
                    pageNumber, xPct, yPct, widthPct, heightPct, signerName);
            return signedPdf;

        } catch (Exception e) {
            LOG.errorf(e, "Failed to sign PDF via remote signing");
            throw new RuntimeException("Digital signature failed: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean validateSignature(byte[] signedPdf) {
        try {
            String token = getAccessToken();
            String pdfBase64 = Base64.getEncoder().encodeToString(signedPdf);

            ObjectNode body = mapper.createObjectNode();
            body.put("document", pdfBase64);

            JsonNode resp = postJson(token, "/api/validate", body);
            LOG.infof("Signature validation result: %s", resp.toString());
            return resp.has("valid") && resp.get("valid").asBoolean();

        } catch (Exception e) {
            LOG.errorf(e, "Failed to validate signature");
            return false;
        }
    }

    // --- Remote signing interface for PDFBox ---

    private class RemoteSignatureInterface implements SignatureInterface {
        private final String sessionId;
        private final String token;

        RemoteSignatureInterface(String sessionId, String token) {
            this.sessionId = sessionId;
            this.token = token;
        }

        @Override
        public byte[] sign(InputStream content) throws java.io.IOException {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = content.read(buffer)) != -1) {
                    digest.update(buffer, 0, bytesRead);
                }
                byte[] hash = digest.digest();
                String hashBase64 = Base64.getEncoder().encodeToString(hash);

                LOG.debugf("Computed SHA-256 hash for remote signing: %s", hashBase64);

                ObjectNode signBody = mapper.createObjectNode();
                signBody.put("session_id", sessionId);
                signBody.put("hash", hashBase64);

                JsonNode signResp = postJson(token, "/api/remote/sign", signBody);
                String cmsBase64 = signResp.get("cms_signature").asText();

                LOG.infof("Remote sign successful: certificate_serial=%s",
                        signResp.has("certificate_serial") ? signResp.get("certificate_serial").asText() : "N/A");

                return Base64.getDecoder().decode(cmsBase64);

            } catch (Exception e) {
                throw new java.io.IOException("Remote signing failed: " + e.getMessage(), e);
            }
        }
    }

    // --- Build DSS locally using PDFBox (same approach as Remote-jsapp-Client but with proper XRef streams) ---

    private byte[] buildLocalDss(byte[] signedPdf, java.util.List<String> chainB64, String token) {
        try {
            // Call /api/remote/validation-data to get OCSP responses + full cert chain
            ObjectNode vdBody = mapper.createObjectNode();
            var certsArray = vdBody.putArray("certificates");
            for (String certB64 : chainB64) {
                certsArray.add(certB64);
            }

            JsonNode vdResp = postJson(token, "/api/remote/validation-data", vdBody);

            java.util.List<byte[]> certBuffers = new java.util.ArrayList<>();
            java.util.List<byte[]> ocspBuffers = new java.util.ArrayList<>();

            if (vdResp.has("certs")) {
                for (JsonNode c : vdResp.get("certs")) {
                    certBuffers.add(Base64.getDecoder().decode(c.asText()));
                }
            }
            if (vdResp.has("ocsps")) {
                for (JsonNode o : vdResp.get("ocsps")) {
                    ocspBuffers.add(Base64.getDecoder().decode(o.asText()));
                }
            }

            if (certBuffers.isEmpty() && ocspBuffers.isEmpty()) {
                LOG.warn("No validation data returned, keeping BASELINE_T PDF");
                return signedPdf;
            }

            // Use PDFBox to add DSS dictionary via proper incremental save
            byte[] result = addDssWithPdfBox(signedPdf, certBuffers, ocspBuffers);
            LOG.infof("DSS built locally with PDFBox: %d certs, %d OCSPs → PAdES_BASELINE_LT (%d bytes)",
                    certBuffers.size(), ocspBuffers.size(), result.length);
            return result;

        } catch (Exception e) {
            LOG.warnf("Failed to build local DSS (keeping BASELINE_T): %s", e.getMessage());
            return signedPdf;
        }
    }

    private byte[] addDssWithPdfBox(byte[] signedPdf, java.util.List<byte[]> certBuffers, java.util.List<byte[]> ocspBuffers) throws Exception {
        try (PDDocument doc = Loader.loadPDF(signedPdf)) {
            org.apache.pdfbox.cos.COSDictionary catalogDict = doc.getDocumentCatalog().getCOSObject();

            // Create DSS dictionary
            org.apache.pdfbox.cos.COSDictionary dssDict = new org.apache.pdfbox.cos.COSDictionary();
            dssDict.setItem(org.apache.pdfbox.cos.COSName.TYPE, org.apache.pdfbox.cos.COSName.getPDFName("DSS"));

            // Add Certs array
            if (!certBuffers.isEmpty()) {
                org.apache.pdfbox.cos.COSArray certsArr = new org.apache.pdfbox.cos.COSArray();
                for (byte[] certData : certBuffers) {
                    org.apache.pdfbox.cos.COSStream certStream = doc.getDocument().createCOSStream();
                    try (java.io.OutputStream os = certStream.createOutputStream()) {
                        os.write(certData);
                    }
                    certsArr.add(certStream);
                }
                dssDict.setItem(org.apache.pdfbox.cos.COSName.getPDFName("Certs"), certsArr);
            }

            // Add OCSPs array
            if (!ocspBuffers.isEmpty()) {
                org.apache.pdfbox.cos.COSArray ocspsArr = new org.apache.pdfbox.cos.COSArray();
                for (byte[] ocspData : ocspBuffers) {
                    org.apache.pdfbox.cos.COSStream ocspStream = doc.getDocument().createCOSStream();
                    try (java.io.OutputStream os = ocspStream.createOutputStream()) {
                        os.write(ocspData);
                    }
                    ocspsArr.add(ocspStream);
                }
                dssDict.setItem(org.apache.pdfbox.cos.COSName.getPDFName("OCSPs"), ocspsArr);
            }

            // Add DSS to catalog
            catalogDict.setItem(org.apache.pdfbox.cos.COSName.getPDFName("DSS"), dssDict);

            // Save incrementally (preserves the signature)
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.saveIncremental(out);
            return out.toByteArray();
        }
    }

    /**
     * Appends a DSS dictionary to the PDF as an incremental update.
     * Same logic as buildDssRevision in Remote-jsapp-Client.
     * Handles both traditional xref tables and XRef streams (PDFBox uses streams).
     */
    private byte[] appendDssRevision(byte[] signedPdf, java.util.List<byte[]> certBuffers, java.util.List<byte[]> ocspBuffers) {
        String pdfStr = new String(signedPdf, java.nio.charset.StandardCharsets.ISO_8859_1);

        // Find last startxref value (works for both traditional and stream xrefs)
        int lastEofIdx = pdfStr.lastIndexOf("%%EOF");
        String beforeEof = pdfStr.substring(0, lastEofIdx);
        int lastStartxrefIdx = beforeEof.lastIndexOf("startxref");
        String afterStartxref = pdfStr.substring(lastStartxrefIdx + 9, lastEofIdx).trim();
        int oldStartxref = Integer.parseInt(afterStartxref.split("\\s")[0]);

        // Determine trailer info — check for traditional trailer or XRef stream
        int sizeVal;
        int rootNum;
        String idHex = null;

        int lastTrailerIdx = beforeEof.lastIndexOf("trailer");
        if (lastTrailerIdx >= 0) {
            // Traditional trailer
            String trailerContent = beforeEof.substring(lastTrailerIdx);
            java.util.regex.Matcher sizeMatcher = java.util.regex.Pattern.compile("/Size\\s+(\\d+)").matcher(trailerContent);
            java.util.regex.Matcher rootMatcher = java.util.regex.Pattern.compile("/Root\\s+(\\d+)\\s+\\d+\\s+R").matcher(trailerContent);
            if (!sizeMatcher.find() || !rootMatcher.find()) {
                throw new RuntimeException("Cannot parse trailer for DSS revision");
            }
            sizeVal = Integer.parseInt(sizeMatcher.group(1));
            rootNum = Integer.parseInt(rootMatcher.group(1));
            java.util.regex.Matcher idMatcher = java.util.regex.Pattern.compile("/ID\\s*\\[\\s*<([0-9A-Fa-f]+)>").matcher(trailerContent);
            if (idMatcher.find()) idHex = idMatcher.group(1);
        } else {
            // XRef stream — trailer info is in the XRef stream object at oldStartxref
            // The object at oldStartxref offset contains /Size, /Root, /ID, /Prev
            String xrefObjArea = pdfStr.substring(oldStartxref, Math.min(oldStartxref + 2000, pdfStr.length()));
            java.util.regex.Matcher sizeMatcher = java.util.regex.Pattern.compile("/Size\\s+(\\d+)").matcher(xrefObjArea);
            java.util.regex.Matcher rootMatcher = java.util.regex.Pattern.compile("/Root\\s+(\\d+)\\s+\\d+\\s+R").matcher(xrefObjArea);
            if (!sizeMatcher.find() || !rootMatcher.find()) {
                throw new RuntimeException("Cannot parse XRef stream for DSS revision");
            }
            sizeVal = Integer.parseInt(sizeMatcher.group(1));
            rootNum = Integer.parseInt(rootMatcher.group(1));
            java.util.regex.Matcher idMatcher = java.util.regex.Pattern.compile("/ID\\s*\\[\\s*<([0-9A-Fa-f]+)>").matcher(xrefObjArea);
            if (idMatcher.find()) idHex = idMatcher.group(1);
        }

        if (idHex == null) {
            try {
                idHex = bytesToHex(MessageDigest.getInstance("SHA-256").digest(signedPdf));
            } catch (java.security.NoSuchAlgorithmException ex) {
                idHex = "00000000000000000000000000000000";
            }
        }

        // Extract catalog info (last version)
        String catalogDict = extractLastObjDict(pdfStr, rootNum);
        java.util.regex.Matcher pagesMatcher = java.util.regex.Pattern.compile("/Pages\\s+(\\d+)\\s+\\d+\\s+R").matcher(catalogDict);
        if (!pagesMatcher.find()) throw new RuntimeException("DSS: /Pages not found in catalog");
        int pagesNum = Integer.parseInt(pagesMatcher.group(1));

        // Extract existing AcroForm (handle nested << >>)
        String acroFormStr = "";
        int acroIdx = catalogDict.indexOf("/AcroForm");
        if (acroIdx >= 0) {
            int acroStart = catalogDict.indexOf("<<", acroIdx);
            if (acroStart >= 0) {
                int depth = 0;
                int p = acroStart;
                while (p < catalogDict.length() - 1) {
                    if (catalogDict.charAt(p) == '<' && catalogDict.charAt(p + 1) == '<') { depth++; p += 2; }
                    else if (catalogDict.charAt(p) == '>' && catalogDict.charAt(p + 1) == '>') {
                        depth--;
                        if (depth == 0) {
                            acroFormStr = "/AcroForm " + catalogDict.substring(acroStart, p + 2) + "\n";
                            break;
                        }
                        p += 2;
                    }
                    else { p++; }
                }
            }
        }

        // Also preserve /Version if present
        String versionStr = "";
        java.util.regex.Matcher versionMatcher = java.util.regex.Pattern.compile("/Version\\s+/[\\d.]+").matcher(catalogDict);
        if (versionMatcher.find()) {
            versionStr = versionMatcher.group() + "\n";
        }

        // Assign object numbers
        int nextObj = sizeVal;
        int[] certObjNums = new int[certBuffers.size()];
        int[] ocspObjNums = new int[ocspBuffers.size()];
        for (int i = 0; i < certBuffers.size(); i++) certObjNums[i] = nextObj++;
        for (int i = 0; i < ocspBuffers.size(); i++) ocspObjNums[i] = nextObj++;
        int dssObjNum = nextObj++;
        int newSize = nextObj;

        // Build objects as binary (cert/OCSP are DER binary data)
        ByteArrayOutputStream appendStream = new ByteArrayOutputStream();
        java.util.Map<Integer, Integer> offsets = new java.util.LinkedHashMap<>();

        try {
            appendStream.write("\n".getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));

            // Cert stream objects
            for (int i = 0; i < certBuffers.size(); i++) {
                byte[] data = certBuffers.get(i);
                offsets.put(certObjNums[i], signedPdf.length + appendStream.size());
                String header = certObjNums[i] + " 0 obj\n<<\n/Length " + data.length + "\n>>\nstream\n";
                appendStream.write(header.getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));
                appendStream.write(data);
                appendStream.write("\nendstream\nendobj\n".getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));
            }

            // OCSP stream objects
            for (int i = 0; i < ocspBuffers.size(); i++) {
                byte[] data = ocspBuffers.get(i);
                offsets.put(ocspObjNums[i], signedPdf.length + appendStream.size());
                String header = ocspObjNums[i] + " 0 obj\n<<\n/Length " + data.length + "\n>>\nstream\n";
                appendStream.write(header.getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));
                appendStream.write(data);
                appendStream.write("\nendstream\nendobj\n".getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));
            }

            // DSS dictionary object
            StringBuilder dssDict = new StringBuilder();
            dssDict.append(dssObjNum).append(" 0 obj\n<<\n/Type /DSS\n");
            if (certObjNums.length > 0) {
                dssDict.append("/Certs [");
                for (int n : certObjNums) dssDict.append(n).append(" 0 R ");
                dssDict.append("]\n");
            }
            if (ocspObjNums.length > 0) {
                dssDict.append("/OCSPs [");
                for (int n : ocspObjNums) dssDict.append(n).append(" 0 R ");
                dssDict.append("]\n");
            }
            dssDict.append(">>\nendobj\n");
            offsets.put(dssObjNum, signedPdf.length + appendStream.size());
            appendStream.write(dssDict.toString().getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));

            // Updated catalog with /DSS reference
            String newCatalog = rootNum + " 0 obj\n<<\n/Type /Catalog\n" + versionStr
                    + "/Pages " + pagesNum + " 0 R\n"
                    + acroFormStr + "/DSS " + dssObjNum + " 0 R\n>>\nendobj\n";
            offsets.put(rootNum, signedPdf.length + appendStream.size());
            appendStream.write(newCatalog.getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));

            // Build xref table (traditional format — valid even if previous was XRef stream)
            int xrefOffset = signedPdf.length + appendStream.size();
            StringBuilder xref = new StringBuilder("xref\n");

            // Group consecutive object numbers (include obj 0 free entry)
            java.util.List<Integer> allNums = new java.util.ArrayList<>();
            allNums.add(0);
            allNums.addAll(offsets.keySet());
            allNums.sort(Integer::compareTo);

            int j = 0;
            while (j < allNums.size()) {
                int start = allNums.get(j);
                int end = start;
                while (j + 1 < allNums.size() && allNums.get(j + 1) == end + 1) {
                    end = allNums.get(++j);
                }
                xref.append(start).append(" ").append(end - start + 1).append("\n");
                for (int n = start; n <= end; n++) {
                    if (n == 0) {
                        xref.append("0000000000 65535 f \n");
                    } else {
                        xref.append(String.format("%010d 00000 n \n", offsets.get(n)));
                    }
                }
                j++;
            }

            xref.append("trailer\n<<\n");
            xref.append("/Size ").append(newSize).append("\n");
            xref.append("/Root ").append(rootNum).append(" 0 R\n");
            xref.append("/ID [<").append(idHex).append("> <").append(idHex).append(">]\n");
            xref.append("/Prev ").append(oldStartxref).append("\n");
            xref.append(">>\nstartxref\n");
            xref.append(xrefOffset).append("\n");
            xref.append("%%EOF\n");

            appendStream.write(xref.toString().getBytes(java.nio.charset.StandardCharsets.ISO_8859_1));

        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to build DSS revision", e);
        }

        // Concatenate original PDF + DSS revision
        byte[] append = appendStream.toByteArray();
        byte[] result = new byte[signedPdf.length + append.length];
        System.arraycopy(signedPdf, 0, result, 0, signedPdf.length);
        System.arraycopy(append, 0, result, signedPdf.length, append.length);
        return result;
    }

    private String extractLastObjDict(String pdfStr, int objNum) {
        String searchStr = objNum + " 0 obj";
        int pos = pdfStr.length();
        int objStart = -1;
        while (pos > 0) {
            pos = pdfStr.lastIndexOf(searchStr, pos - 1);
            if (pos == -1) break;
            if (pos == 0 || Character.isWhitespace(pdfStr.charAt(pos - 1))) {
                objStart = pos;
                break;
            }
        }
        if (objStart == -1) throw new RuntimeException("Object " + objNum + " not found");

        int dictStart = pdfStr.indexOf("<<", objStart);
        if (dictStart == -1) throw new RuntimeException("Dict of object " + objNum + " not found");

        int depth = 0;
        int p = dictStart;
        while (p < pdfStr.length() - 1) {
            if (pdfStr.charAt(p) == '<' && pdfStr.charAt(p + 1) == '<') { depth++; p += 2; }
            else if (pdfStr.charAt(p) == '>' && pdfStr.charAt(p + 1) == '>') {
                depth--;
                if (depth == 0) return pdfStr.substring(dictStart + 2, p).trim();
                p += 2;
            }
            else { p++; }
        }
        throw new RuntimeException("End of dict for object " + objNum + " not found");
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02X", b));
        return sb.toString();
    }

    // --- HTTP helpers ---

    private JsonNode postJson(String token, String path, ObjectNode body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(signingBaseUrl + path))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .timeout(Duration.ofSeconds(60))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 401) {
            accessToken = null;
            String newToken = getAccessToken();
            request = HttpRequest.newBuilder()
                    .uri(URI.create(signingBaseUrl + path))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + newToken)
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .timeout(Duration.ofSeconds(60))
                    .build();
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        }

        if (response.statusCode() != 200) {
            throw new RuntimeException("API " + path + " returned " + response.statusCode() + ": " + response.body());
        }

        return mapper.readTree(response.body());
    }

    private synchronized String getAccessToken() {
        if (accessToken != null && Instant.now().isBefore(tokenExpiry)) {
            return accessToken;
        }

        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("username", signingUsername);
            body.put("password", signingPassword);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(signingBaseUrl + "/api/auth/login"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Auth failed: " + response.statusCode() + " " + response.body());
            }

            JsonNode resp = mapper.readTree(response.body());
            accessToken = resp.get("access_token").asText();
            int expiresIn = resp.has("expires_in") ? resp.get("expires_in").asInt() : 300;
            tokenExpiry = Instant.now().plusSeconds(expiresIn - 30);

            LOG.infof("Authenticated with signing service (expires in %ds)", expiresIn);
            return accessToken;

        } catch (Exception e) {
            throw new RuntimeException("Signing service auth failed: " + e.getMessage(), e);
        }
    }

    private static javax.net.ssl.SSLContext createTrustAllSslContext() {
        try {
            javax.net.ssl.SSLContext ctx = javax.net.ssl.SSLContext.getInstance("TLS");
            ctx.init(null, new javax.net.ssl.TrustManager[]{
                    new javax.net.ssl.X509TrustManager() {
                        public java.security.cert.X509Certificate[] getAcceptedIssuers() { return new java.security.cert.X509Certificate[0]; }
                        public void checkClientTrusted(java.security.cert.X509Certificate[] c, String t) {}
                        public void checkServerTrusted(java.security.cert.X509Certificate[] c, String t) {}
                    }
            }, new java.security.SecureRandom());
            return ctx;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create SSL context", e);
        }
    }
}
