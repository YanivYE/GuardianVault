const zlib = require('zlib');

class Compressor
{
    constructor() {}

    compressFile(decompressedFileData)
    {
        const compressedData = zlib.gzipSync(decompressedFileData);
        return compressedData;
    }

    decompressFile(compressedFileData)
    {
        const decompressedData = zlib.gunzipSync(compressedFileData);
        return decompressedData;
    }
}

module.exports = {Compressor};