declare module 'exif-parser' {
    export function create(buffer: Buffer): {
        parse(): {
            tags: Record<string, any>;
        };
    };
}
