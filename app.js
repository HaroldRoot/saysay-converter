window.addEventListener('DOMContentLoaded', () => {

    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const convertButton = document.getElementById('convertButton');

    let conversionRegex;
    let emojiMap;

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    async function loadMapping() {
        try {
            const response = await fetch('mapping.json');
            if (!response.ok) {
                throw new Error(`HTTP 错误! 状态: ${response.status}`);
            }
            emojiMap = await response.json();

            const keys = Object.keys(emojiMap);

            keys.sort((a, b) => b.length - a.length);

            const escapedKeys = keys.map(escapeRegExp);

            conversionRegex = new RegExp(escapedKeys.join('|'), 'g');

            convertButton.disabled = false;
            convertButton.textContent = '🚀 转换表情代码';

        } catch (error) {
            console.error('加载 mapping.json 失败:', error);
            alert('错误：无法加载表情映射文件。请检查 mapping.json 是否存在以及网络连接。');
            convertButton.textContent = '加载失败';
        }
    }

    function convertText() {
        if (!conversionRegex || !emojiMap) {
            alert('映射数据尚未加载完成，请稍候。');
            return;
        }

        const originalText = inputText.value;

        const convertedText = originalText.replace(conversionRegex, (match) => {
            return emojiMap[match];
        });

        outputText.value = convertedText;
    }

    convertButton.disabled = true;
    convertButton.textContent = '加载中...';

    convertButton.addEventListener('click', convertText);

    loadMapping();
});