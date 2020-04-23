import { Readable } from 'stream';

export async function handleUpload(
    fieldName: string,
    stream: Readable,
    filename: string,
    encoding: string,
    mimetype: string,
    body: Record<string, any>,
): Promise<void> {
    const buf: Buffer[] = [];
    stream.on('data', (chunk) => {
        buf.push(chunk);
    });

    stream.on('end', () => {
        body[fieldName] = {
            data: Buffer.concat(buf),
            filename,
            encoding,
            mimetype,
            limit: false,
        };
    });
}
