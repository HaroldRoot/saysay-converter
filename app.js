window.addEventListener('DOMContentLoaded', () => {

    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const convertButton = document.getElementById('convertButton');
    const copyButton = document.getElementById('copyButton');
    const clearButton = document.getElementById('clearButton');
    const inputCount = document.getElementById('inputCount');
    const outputCount = document.getElementById('outputCount');
    const toast = document.getElementById('toast');

    let conversionRegex;
    let emojiMap;
    let toastTimer;

    const convertLabelHTML = '<span class="btn__icon" aria-hidden="true">→</span><span><span class="btn__label-long">转换成 </span>emoji</span>';

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function showToast(message, type = 'ok') {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove('toast--ok', 'toast--err');
        toast.classList.add(type === 'err' ? 'toast--err' : 'toast--ok');
        toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
    }

    function updateCounts() {
        const i = [...inputText.value].length;
        const o = [...outputText.value].length;
        inputCount.textContent = `${i} 字`;
        outputCount.textContent = `${o} 字`;
    }

    async function loadMapping() {
        try {
            const response = await fetch('mapping.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            emojiMap = await response.json();

            const keys = Object.keys(emojiMap).sort((a, b) => b.length - a.length);
            conversionRegex = new RegExp(keys.map(escapeRegExp).join('|'), 'g');

            convertButton.disabled = false;
            convertButton.innerHTML = convertLabelHTML;

        } catch (error) {
            console.error('加载 mapping.json 失败:', error);
            convertButton.disabled = true;
            convertButton.textContent = '加载失败';
            showToast('表情映射文件加载失败，请刷新页面重试。', 'err');
        }
    }

    function convertText() {
        if (!conversionRegex || !emojiMap) {
            showToast('映射数据尚未加载完成，请稍候。', 'err');
            return;
        }
        if (!inputText.value.trim()) {
            showToast('输入内容为空。', 'err');
            inputText.focus();
            return;
        }
        outputText.value = inputText.value.replace(conversionRegex, (m) => emojiMap[m]);
        updateCounts();
    }

    function copyOutput() {
        if (!outputText.value) {
            showToast('输出内容为空，无需复制。', 'err');
            return;
        }
        const done = () => showToast('已复制到剪贴板');
        const fail = () => showToast('复制失败，请手动选择并复制。', 'err');

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(outputText.value).then(done).catch(() => {
                outputText.select();
                try { document.execCommand('copy') ? done() : fail(); } catch { fail(); }
            });
        } else {
            outputText.select();
            try { document.execCommand('copy') ? done() : fail(); } catch { fail(); }
        }
    }

    function clearInput() {
        if (!inputText.value && !outputText.value) {
            inputText.focus();
            return;
        }
        inputText.value = '';
        outputText.value = '';
        updateCounts();
        inputText.focus();
        showToast('已清空');
    }

    convertButton.disabled = true;
    convertButton.textContent = '加载中…';

    convertButton.addEventListener('click', convertText);
    copyButton.addEventListener('click', copyOutput);
    clearButton.addEventListener('click', clearInput);
    inputText.addEventListener('input', updateCounts);

    inputText.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            convertText();
        }
    });

    updateCounts();
    loadMapping();
});
