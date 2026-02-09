
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

export async function processPdf(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = async function() {
            try {
                const typedarray = new Uint8Array(this.result);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map(item => item.str).join(' ') + ' ';
                }
                const sentences = fullText.replace(/([.!?])\s+(?=[A-Z])/g, "$1|").split("|").filter(s => s.trim().length > 5);
                resolve(sentences);
            } catch (error) {
                reject(error);
            }
        };
        fileReader.onerror = () => {
            reject(new Error('PDF 파일을 읽는 중 오류가 발생했습니다.'));
        };
        fileReader.readAsArrayBuffer(file);
    });
}
