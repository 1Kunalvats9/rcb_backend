# API curl Examples

## PDF Ingestion Endpoint

### Basic PDF Upload (Local)
```bash
curl -X POST http://localhost:3000/ingest/pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/document.pdf"
```

### PDF Upload (Render/Production)
```bash
curl -X POST https://rcb-backend-cj24.onrender.com/ingest/pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/document.pdf"
```

### With Verbose Output (to see response)
```bash
curl -X POST http://localhost:3000/ingest/pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@./test.pdf" \
  -v
```

### Save Response to File
```bash
curl -X POST http://localhost:3000/ingest/pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@./test.pdf" \
  -o response.json
```

## Text Ingestion Endpoint

### Basic Text Ingestion
```bash
curl -X POST http://localhost:3000/ingest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "doc_123",
    "text": "This is some text to ingest and create embeddings for."
  }'
```

## Authentication

### Get JWT Token (if you have an auth endpoint)
```bash
# Example login request (adjust based on your auth route)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## Testing PDF Upload

### Quick Test with a Sample PDF
```bash
# Create a test PDF first, or use an existing one
curl -X POST http://localhost:3000/ingest/pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@sample.pdf" \
  | jq .
```

### Check Response Format
The successful response should look like:
```json
{
  "success": true,
  "message": "PDF ingested successfully",
  "chunks": 15,
  "documentId": "507f1f77bcf86cd799439011"
}
```

## Error Examples

### Missing Token
```bash
curl -X POST http://localhost:3000/ingest/pdf \
  -F "file=@test.pdf"
# Expected: 401 Unauthorized
```

### Wrong File Type
```bash
curl -X POST http://localhost:3000/ingest/pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.txt"
# Expected: 400 Bad Request - "File is not a PDF."
```

### No File Uploaded
```bash
curl -X POST http://localhost:3000/ingest/pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 400 Bad Request - "No PDF file uploaded."
```

## Notes

- Replace `YOUR_JWT_TOKEN` with an actual JWT token from your authentication
- Replace `/path/to/your/document.pdf` with the actual path to your PDF file
- The field name for the file upload must be `"file"` (as defined in the route)
- For production, replace `localhost:3000` with your Render URL: `https://rcb-backend-cj24.onrender.com`
- Make sure the PDF file exists and is readable
- The endpoint expects `multipart/form-data` (handled automatically by `-F` flag in curl)

