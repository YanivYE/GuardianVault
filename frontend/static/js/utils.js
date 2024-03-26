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

export const extentionToMIME = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "bmp": "image/bmp",
    "webp": "image/webp",
    "ico": "image/x-icon",
    "tif": "image/tiff",
    "tiff": "image/tiff",
    "svg": "image/svg+xml",
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xls": "application/vnd.ms-excel",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "ppt": "application/vnd.ms-powerpoint",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "csv": "text/csv",
    "txt": "text/plain",
    "html": "text/html",
    "css": "text/css",
    "json": "application/json",
    "xml": "application/xml",
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "mp4": "video/mp4",
    "avi": "video/x-msvideo",
    "mkv": "video/x-matroska",
    "wmv": "video/x-ms-wmv",
    "flv": "video/x-flv",
    "mov": "video/quicktime",
    "zip": "application/zip",
    "tar.gz": "application/gzip",
    "rar": "application/vnd.rar",
    "7z": "application/x-7z-compressed",
    "apk": "application/vnd.android.package-archive",
    "deb": "application/x-debian-package",
    "rpm": "application/x-redhat-package-manager",
    "tar": "application/x-tar",
    "gz": "application/gzip",
    "psd": "image/vnd.adobe.photoshop",
    "ai": "application/postscript",
    "eps": "application/postscript",
    "svgz": "image/svg+xml",
    "dwg": "image/vnd.dwg",
    "dxf": "image/vnd.dxf",
    "m4a": "audio/mp4",
    "m4v": "video/mp4",
    "webm": "video/webm",
    "ogg": "audio/ogg",
    "ogv": "video/ogg",
    "oga": "audio/ogg",
    "woff": "font/woff",
    "woff2": "font/woff2",
    "ttf": "font/ttf",
    "otf": "font/otf",
    "eot": "application/vnd.ms-fontobject",
    "csv": "text/csv",
};

export const signatureToMIME = {
    "89504E47": "image/png",
    "FFD8FF": "image/jpeg",
    "47494638": "image/gif",
    "424D": "image/bmp",            
    "52494646": "image/webp",
    "00000100": "image/x-icon",
    "49492A00": "image/tiff",
    "3C3F786D6C": "image/svg+xml",
    "25504446": "application/pdf",
    "D0CF11E0": "application/msword",
    "504B0304": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "2C": "text/csv",
    "3C21444F43": "text/html",
    "7B": "application/json",
    "1F8B": "application/gzip",
    "52617221": "application/vnd.rar",
    "377ABCAF": "application/x-7z-compressed",
    "213C6172": "application/x-debian-package",
    "EDABEEDB": "application/x-redhat-package-manager",
    "75737461": "application/x-tar",
    "38425053": "image/vnd.adobe.photoshop",
    "25215053": "application/postscript",
    "41433130": "image/vnd.dwg",
    "66747970": "video/mp4",
    "000001B": "video/x-msvideo",
    "1A45DFA3": "video/x-matroska",
    "3026B2758": "video/x-ms-wmv",
    "464C56": "video/x-flv",
    "1A45DFA3": "video/quicktime",
    "504B0304": "application/zip",
    "1F8B": "application/gzip",
    "377ABCAF": "application/x-7z-compressed",
    "504B0304": "application/vnd.android.package-archive",
    "213C6172": "application/x-debian-package",
    "EDABEEDB": "application/x-redhat-package-manager",
    "75737461": "application/x-tar",
    "774F": "font/woff",
    "774F4632": "font/woff2",
    "00010000": "font/ttf",
    "4F54544F": "font/otf",
    "00010000": "application/vnd.ms-fontobject",
};

export function getMIMExtension(MIME) {
    for (const [extension, mimeType] of Object.entries(extentionToMIME)) {
        if (mimeType === MIME) {
            return extension;
        }
    }
    return null; // If MIME type is not found
}