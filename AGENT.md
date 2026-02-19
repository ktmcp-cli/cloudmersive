# AGENT.md — Cloudmersive OCR CLI

Reference guide for AI agents interacting with this CLI.

---

## Package

- Name: `@ktmcp-cli/cloudmersive`
- Entry: `src/index.js`
- Binary: `bin/cloudmersive.js`
- Type: ESM (`"type": "module"`)

---

## Setup

```bash
npm install
cloudmersive config set --api-key <KEY>
```

Config is stored via `conf` in the OS user config directory under `ktmcp-cloudmersive`.

---

## Key Workflows

### 1. Extract text from an image

```bash
cloudmersive image to-text ./scan.png
# Returns: plain text extracted from the image
```

Use `--json` to get structured response:

```bash
cloudmersive image to-text ./scan.png --json
# Returns JSON with TextResult field
```

### 2. Extract text from a PDF

```bash
cloudmersive pdf to-text ./document.pdf
cloudmersive pdf to-text ./document.pdf --json
```

### 3. Recognize a receipt

```bash
cloudmersive photo recognize-receipt ./receipt.jpg --json
# Returns structured JSON with merchant, items, totals, etc.
```

### 4. Extract business card data

```bash
cloudmersive photo recognize-business-card ./card.jpg --json
# Returns contact fields: name, email, phone, company, etc.
```

### 5. Extract form fields

```bash
cloudmersive photo recognize-form ./form.png --json
# Returns detected form fields and their values
```

### 6. Detect page angle (deskewing)

```bash
cloudmersive preprocess page-angle ./skewed.jpg --json
# Returns: { "Angle": 3.5, "Successful": true }
```

### 7. Binarize image before OCR

```bash
cloudmersive preprocess binarize ./photo.jpg
# Returns preprocessed image data (base64 or URL depending on API response)
```

---

## File Structure

```
cloudmersive/
  bin/
    cloudmersive.js      # CLI entry point (executable)
  src/
    index.js             # Commander CLI commands
    api.js               # Cloudmersive API calls (axios + form-data)
    config.js            # Conf-based config store
  package.json
  README.md
  AGENT.md               # This file
  LICENSE
  banner.svg
```

---

## Source Files

### src/config.js

Exports: `getConfig(key)`, `setConfig(key, value)`, `getAllConfig()`, `clearConfig()`, `isConfigured()`

Uses `conf` package with `projectName: 'ktmcp-cloudmersive'` and schema `{ apiKey: { type: 'string', default: '' } }`.

### src/api.js

All functions accept a `filePath` string and return a Promise resolving to the API JSON response.

| Export | Method | Endpoint |
|---|---|---|
| `imageToText(filePath)` | POST | `/ocr/image/toText` |
| `imageToLines(filePath)` | POST | `/ocr/image/to/lines-with-location` |
| `pdfToText(filePath)` | POST | `/ocr/pdf/toText` |
| `photoToText(filePath)` | POST | `/ocr/photo/toText` |
| `recognizeReceipt(filePath)` | POST | `/ocr/photo/recognize/receipt` |
| `recognizeBusinessCard(filePath)` | POST | `/ocr/photo/recognize/business-card` |
| `recognizeForm(filePath)` | POST | `/ocr/photo/recognize/form` |
| `preprocessBinarize(filePath)` | POST | `/ocr/preprocessing/image/binarize` |
| `getPageAngle(filePath)` | POST | `/ocr/preprocessing/image/get-page-angle` |

All use `form-data` multipart upload with field name `imageFile` and auth header `Apikey: <key>`.

### src/index.js

Commander program with command groups: `config`, `image`, `pdf`, `photo`, `preprocess`.

All operation commands:
- Accept a `<file>` positional argument
- Support `--json` flag to output raw API response
- Use `ora` spinner when not in JSON mode
- Use `chalk` for colored output
- Exit with code 1 on error

---

## Error Handling

- Missing API key: prints message and exits 1
- HTTP errors: prints `HTTP {status}: {body}` and exits 1
- Network errors: prints error message and exits 1

---

## Dependencies

| Package | Purpose |
|---|---|
| `commander` | CLI argument parsing |
| `axios` | HTTP client |
| `chalk` | Terminal colors |
| `ora` | Spinner/progress |
| `conf` | Persistent config storage |
| `form-data` | Multipart file upload |

---

## Cloudmersive API Notes

- Base URL: `https://api.cloudmersive.com`
- Auth: `Apikey` header (not `Authorization: Bearer`)
- All OCR endpoints accept `multipart/form-data` with field `imageFile`
- Free tier: 800 API calls/month
- Docs: https://api.cloudmersive.com/docs/ocr.asp
