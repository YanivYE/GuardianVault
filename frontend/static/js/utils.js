export async function hexToCryptoKey(hexString) {
    const keyData = hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        new Uint8Array(keyData),
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
    return cryptoKey;
}

export function arrayBufferToBase64(arrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString);
}

export function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const length = binaryString.length;
    const arrayBuffer = new ArrayBuffer(length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
    }

    return arrayBuffer;
}

export function arrayBufferToHexString(arrayBuffer) {
    const byteArray = new Uint8Array(arrayBuffer);
    return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

export const supportedFileSignatures = {
    "png": "89504E47",
    "jpg": "FFD8FF",
    "jpeg": "FFD8FF",
    "gif": "47494638",
    "bmp": "424D",
    "webp": "52494646",
    "ico": "00000100",
    "tif": "49492A00",
    "tiff": "49492A00",
    "svg": "3C737667",
    "pdf": "25504446",
    "doc": "D0CF11E0",
    "docx": "504B0304",
    "xls": "D0CF11E0",
    "xlsx": "504B0304",
    "ppt": "D0CF11E0",
    "pptx": "504B0304",
    "csv": "0D0A",
    "txt": "74657874",
    "html": "3C68746D6C",
    "css": "2F2A",
    "json": "7B",
    "xml": "3C3F786D6C",
    "mp3": "494433",
    "wav": "52494646",
    "mp4": "66747970",
    "avi": "52494646",
    "mkv": "1A45DFA3",
    "wmv": "3026B2758E66CF11",
    "flv": "464C5601",
    "mov": "6D6F6F76",
    "zip": "504B0304",
    "tar.gz": "1F8B",
    "rar": "52617221",
    "7z": "377ABCAF271C",
    "apk": "504B0304",
    "deb": "213C617263683E0A",
    "rpm": "EDABEEDB",
    "tar": "7573746172",
    "gz": "1F8B",
    "psd": "38425053",
    "ai": "252150532D41646F6265",
    "eps": "252150532D41646F6265",
    "svgz": "1F8B",
    "dwg": "41433130",
    "dxf": "41433130",
    "m4a": "00000020667479704D3441",
    "m4v": "00000020667479706D703432",
    "webm": "1A45DFA3",
    "ogg": "4F676753",
    "ogv": "4F676753",
    "oga": "4F676753",
    "woff": "774F4646",
    "woff2": "774F4632",
    "ttf": "0001000000040000",
    "otf": "4F54544F",
    "eot": "504B0304",
    "csv": "0D0A",
};