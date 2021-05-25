const newButtonId = 'deepl-connector-extension-button';

const targetTextSelector = '.lmt__target_textarea';
const sourceTextSelector = '.lmt__source_textarea';

const showDebug = true;

if (document.getElementById(newButtonId)) {
  console.warn(`already added button #${newButtonId}`)
}
else {
  chrome.storage.sync.get(
    ['backendUrl'],
    addButton // callback
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitFor(parentNode, selector, timeoutMs) {
  const stepMs = 100;
  if (!timeoutMs) timeoutMs = 100 * stepMs;
  for (let round = 0; round < Math.ceil(timeoutMs/stepMs); round++) {
    const e = parentNode.querySelector(selector);
    if (e) return e;
    if (showDebug) console.log('waiting for ' + selector);
    await sleep(stepMs);
  }
  if (showDebug) console.log('error: timeout waiting for ' + selector);
  return null; // timeout
}

async function addButton({ backendUrl }) {

  if (backendUrl == undefined) {
    alert('extension deepl-connector: please set backend url');
    return;
  }

  //console.log(`content.js: got backendUrl ${backendUrl}`);

  // https://www.svgrepo.com/svg/73029/plug
  const icon_size = 39;
  const icon_svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${icon_size}" height="${icon_size}" viewBox="0 0 36.787 36.381"
    >
      <path
        d="m33.267 26.752c-0.844 0.845-2.212 0.845-3.057 0l-1.351-1.35c-6.26 5.793-14.302 7.537-19.108 4.283l-5.315 5.317c-0.845 0.845-2.213 0.845-3.058 0-0.844-0.846-0.844-2.213 0-3.059l5.533-5.531c-2.393-4.87-0.513-12.246 4.884-18.08l-1.349-1.348c-0.845-0.845-0.845-2.213 0-3.059 0.845-0.842 2.212-0.842 3.058 0l3.463 3.465 6.012-6.012c0.846-0.845 2.212-0.845 3.057 0 0.846 0.845 0.846 2.211 0 3.057l-6.013 6.012 6.316 6.316 6.012-6.012c0.846-0.846 2.213-0.846 3.058 0 0.844 0.844 0.844 2.213 0 3.056l-6.013 6.013 3.871 3.871c0.846 0.848 0.846 2.215 0 3.061z"
        fill="none" stroke-width="1.5"
      />
    </svg>
  `;

  const parentSelector = 'div.lmt__docTrans-tab-container > div:first-child';
  const buttonSelector = 'button:last-child';
  const svgSelector = 'svg';
  const titleSelector = 'div > div:last-child > div:first-child';
  const subtitleSelector = 'div > div:last-child > div:last-child';

  const parentNode = await waitFor(document, parentSelector);
  const button = await waitFor(parentNode, buttonSelector);
  await waitFor(button, svgSelector);
  await waitFor(button, titleSelector);
  await waitFor(button, subtitleSelector);

  const newButton = button.cloneNode(true);
  newButton.id = newButtonId;
  newButton.querySelector(svgSelector).parentNode.innerHTML = icon_svg;
  newButton.querySelector(titleSelector).innerHTML = 'Connect';
  newButton.querySelector(subtitleSelector).innerHTML = 'to Backend';
  parentNode.appendChild(newButton);

  newButton.onclick = event => {
    // get next sourceText from backend
    const res = await fetch(`${backendUrl}/api/sourceText`);
    const data = res.json();
    if (data.ok) {
      const sourceTextElement = document.querySelector(sourceTextSelector);
      sourceTextElement.value = data.sourceText;
      // fire paste event
      // TODO verify (works in jsdom)
      const pasteEvent = new window.Event('paste', { bubbles: true, cancelable: true });
      pasteEvent.clipboardData = { getData: () => data.sourceText };
      sourceTextElement.dispatchEvent(pasteEvent);
    }
    else {
      console.warn(data.why)
      // TODO show popup-modal with error message = data.why
    }
  };
}
