const zlib = require('zlib');

// Class representing a file compressor
class Compressor {
    constructor() {}

    // Compresses file data using gzip compression
    compressFile(decompressedFileData) {
        // Use zlib's gzipSync method to compress file data
        const compressedData = zlib.gzipSync(decompressedFileData);
        return compressedData;
    }

    // Decompresses compressed file data
    decompressFile(compressedFileData) {
        // Use zlib's gunzipSync method to decompress file data
        const decompressedData = zlib.gunzipSync(compressedFileData);
        return decompressedData;
    }
}

// Export the Compressor class for use in other modules
module.exports = { Compressor };
