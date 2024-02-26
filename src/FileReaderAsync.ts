export default class FileReaderAsync {

    readAsText(file: File): Promise<string|null> {
        let reader = new FileReader();

        return new Promise<string | null>((resolve, reject) => {
            reader.onload = () => {
                resolve(reader.result as string);
            };
            reader.onerror = () => {
                reject(reader.error);
            };
            reader.readAsText(file);
        });
    }
}