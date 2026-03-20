export function filter_filename(name: string) {
    // Remove characters that are not allowed in file names on Windows, macOS, and Linux
    return name.replace(/[/\\?%*:|"<>]/g, '_');
}
