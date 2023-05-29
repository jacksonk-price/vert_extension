let boolStarted = false;

chrome.runtime.onMessage.addListener((request) => {
    if (!request.activate) return;
    const trackedElement = document.getElementById('content');

    const config = { childList: true, subtree: true };

    const callback = (mutationList, observer) => {
        const isMenuMutated = mutationList.some(mutation =>
          mutation.target.id === 'menu' && mutation.target.classList.contains('style-scope')
        );
      
        if (isMenuMutated && !boolStarted) {
          startExtension();
          observer.disconnect();
        }
      };
      
      const observer = new MutationObserver(callback);
      observer.observe(trackedElement, config);
});

const startExtension = () => {
    boolStarted = true;

    const boolDarkMode = document.querySelector('html').hasAttribute('dark');
    const actionsContainer = document.getElementById('above-the-fold');
    const actionsRow = actionsContainer.querySelector('#top-row');
    const buttonMenu = actionsRow.querySelector('#menu');
    const menuRenderer = buttonMenu.querySelector('.style-scope.ytd-watch-metadata');
    const styleClass = boolDarkMode ? 'light-stroke' : 'dark-stroke';
    const buttonStyle = boolDarkMode ? 'dark-style' : 'light-style';

    // svg icons
    const downloadIcon = `<svg class="icon ${styleClass}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="none" color="currentColor"><path d="M48 96V416c0 8.8 7.2 16 16 16H384c8.8 0 16-7.2 16-16V170.5c0-4.2-1.7-8.3-4.7-11.3l33.9-33.9c12 12 18.7 28.3 18.7 45.3V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96C0 60.7 28.7 32 64 32H309.5c17 0 33.3 6.7 45.3 18.7l74.5 74.5-33.9 33.9L320.8 84.7c-.3-.3-.5-.5-.8-.8V184c0 13.3-10.7 24-24 24H104c-13.3 0-24-10.7-24-24V80H64c-8.8 0-16 7.2-16 16zm80-16v80H272V80H128zm32 240a64 64 0 1 1 128 0 64 64 0 1 1 -128 0z"/></svg>`;

    const successIcon = `<svg class="icon success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"/></svg>`

    const errorIcon = `<svg class="icon error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/></svg>`;

    const loadingIcon = `<svg class="icon fa-spin ${styleClass}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"/></svg>`;


    async function handleDownload(e) {
        const data = window.location.href;
        const response = await fetchConversionResult(data);
        const result = await response.json();
    
        if (response.ok) {
            handleSuccess(result);
        } else {
            handleError();
        }
    }
    
    async function fetchConversionResult(data) {
        return await fetch('http://127.0.0.1:3000/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input_url: data })
        });
    }

    const createDownloadButton = () => {
        let downloadButton = document.createElement('button');
        downloadButton.id = 'download-btn'
        downloadButton.classList.add('download-btn');
        downloadButton.classList.add(`${buttonStyle}`);
        downloadButton.innerHTML = downloadIcon;

        downloadButton.addEventListener('click', function(){
            downloadButton.disabled = true;
            downloadButton.innerHTML = loadingIcon;
            handleDownload();
        });

        menuRenderer.appendChild(downloadButton);
    }

    const handleSuccess = (result) => {
        let downloadButton = getDownloadButton();
        let base64 = result["wav_base64"];

        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;

        const blob = new Blob([arrayBuffer], { type: 'audio/wav' });

        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${result["video_title"]}.wav`;

        downloadLink.click();
        downloadLink.remove();

        downloadButton.innerHTML = successIcon;
        setTimeout(() => {
            downloadButton.disabled = false;
            downloadButton.innerHTML = downloadIcon;
        }, 5000);
    }

    const handleError = () => {
        let downloadButton = getDownloadButton();

        downloadButton.innerHTML = errorIcon;

        setTimeout(() => {
            downloadButton.disabled = false;
            downloadButton.innerHTML = downloadIcon;
          }, 5000);
    }

    const getDownloadButton = () => {
        return document.getElementById('download-btn');
    }

    createDownloadButton();
}