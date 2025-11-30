// CommonJS wrapper for pdf-parse
const pdfParseModule = require("pdf-parse");

// pdf-parse v2.4.5 exports a PDFParse class, not a function
// Create a wrapper function that uses the class
const pdfParse = async (buffer, options = {}) => {
  const parser = new pdfParseModule.PDFParse({ 
    data: buffer,
    ...options 
  });
  
  // Use getText() method to extract text (the old API behavior)
  const result = await parser.getText(options);
  
  // Return in the format expected by the old API
  return {
    text: result.text || "",
    numPages: result.total || 0,
    info: null,
    metadata: null
  };
};

// Export as both default and named export for compatibility
module.exports = pdfParse;
module.exports.default = pdfParse;

