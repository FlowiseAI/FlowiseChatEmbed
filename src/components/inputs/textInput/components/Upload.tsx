import { createSignal, onMount, Show } from 'solid-js';

type UploadProps = {
  chatId?: string;
  customerId?: string;
  uploadColor?: string;
  onUpload: (isSuccess: boolean, message: string) => void;
};

export const Upload = (props: UploadProps) => {
  const [isEnabled, setIsEnabled] = createSignal(false);
  const [folderId, setFolderId] = createSignal(undefined);
  const [isUploading, setIsUploading] = createSignal(false);

  const divideFileInChunks = (fileData: any) => {
    const fileChunks = [];
    const maxBlob = 256 * 10 * 1024; // each chunk size (2.5MB)
    let offset = 0;
    while (offset < fileData.size) {
      const chunkSize = Math.min(maxBlob, fileData.size - offset);
      fileChunks.push({
        blob: fileData.slice(offset, offset + chunkSize),
        start: offset,
        end: offset + chunkSize,
      });
      offset += chunkSize;
    }
    return fileChunks;
  };

  const uploadFiles = (fileData: any) => {
    if (fileData && fileData.size) {
      const gb = fileData.size / 1024 ** 3;
      if (gb > 2) {
        props.onUpload(false, 'Please do not upload a file larger than 2 GB');
        return;
      }
    }
    setIsUploading(true);
    const meta = {
      name: fileData.name,
      mimeType: fileData.type,
      parents: [folderId()],
      appProperties: { chatId: props.chatId },
      fields: 'id',
    };
    const fileChunks: any = divideFileInChunks(fileData); // divide the file into chunks
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meta,
        contentLength: fileData.size,
      }),
    };
    fetch('https://upload-files-app.calmpond-81c5bb18.eastus.azurecontainerapps.io/session', options)
      // fetch('http://localhost:5001/session', options)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error();
        }
        const session_response = await res.json();
        const sessionId = session_response.sessionId;
        for (let i = 0; i < fileChunks.length; i += 1) {
          const formData = new FormData();
          formData.append('blob', fileChunks[i].blob, 'blobChunk');
          formData.append('start', fileChunks[i].start);
          formData.append('end', fileChunks[i].end);
          formData.append('contentLength', fileData.size);
          formData.append('sessionId', sessionId);
          formData.append('customerId', props.customerId ? props.customerId : '');
          formData.append('chatId', props.chatId ? props.chatId : '');

          await fetch('https://upload-files-app.calmpond-81c5bb18.eastus.azurecontainerapps.io/upload', {
            // await fetch('http://localhost:5001/upload', {
            method: 'POST',
            body: formData,
          });
          updateProgressBar(((i + 1) / fileChunks.length) * 100);
        }
        return Promise.resolve('File Uploaded Successfully');
      })
      .then(() => {
        setTimeout(() => {
          setIsUploading(false);
          props.onUpload(true, 'Thank you for sharing this file');
        }, 500);
      })
      .catch((err) => {
        setIsUploading(false);
        props.onUpload(false, 'Error occurred while uploading file, please retry..');
      });
  };

  const updateProgressBar = (percentage: number) => {
    const chatbot = document.querySelector('flowise-chatbot');
    if (!!chatbot && !!chatbot.shadowRoot) {
      const chatBotDocument = chatbot.shadowRoot;
      const progressCircle = chatBotDocument.getElementById('progress-circle');
      if (progressCircle != null) {
        const dasharray = progressCircle.getAttribute('stroke-dasharray');
        const circleLength: number = parseFloat(dasharray || '0');
        const offset: number = circleLength * (1 - percentage / 100);
        progressCircle.setAttribute('stroke-dashoffset', '' + offset);
      }
    }
  };

  const getProgressBar = () => {
    return (
      <svg
        id="progressBarContainer"
        width="30"
        viewBox="-14.125 -14.125 141.25 141.25"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: 'rotate(-90deg)', 'margin-bottom': '10' }}
      >
        <circle
          r="46.5"
          cx="56.5"
          cy="56.5"
          fill="transparent"
          stroke="#e0e0e0"
          stroke-width="13"
          stroke-dasharray="292.02000000000004px"
          stroke-dashoffset="0"
        />
        <circle
          id="progress-circle"
          r="46.5"
          cx="56.5"
          cy="56.5"
          stroke={props.uploadColor}
          stroke-width="9"
          stroke-linecap="round"
          stroke-dashoffset="219px"
          fill="transparent"
          stroke-dasharray="292.02000000000004px"
        />
      </svg>
    );
  };

  const onUploadClick = (e: any) => {
    const fileButton = getInputFileButton();
    if (fileButton) fileButton.click();
    e.stopPropagation();
  };

  const getUpload = () => {
    return (
      <div onClick={onUploadClick} style={{ cursor: 'pointer' }}>
        <svg
          width="64px"
          height="64px"
          viewBox="0 0 24.00 24.00"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          stroke="#000000"
          style={{ width: '30px', height: '50px' }}
        >
          <g id="SVGRepo_bgCarrier" stroke-width="0" />
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" />
          <g id="SVGRepo_iconCarrier">
            {' '}
            <path
              d="M19.002 21V15M21.0303 17L19.0303 15L17.0303 17M13 3H8.2C7.0799 3 6.51984 3 6.09202 3.21799C5.71569 3.40973 5.40973 3.71569 5.21799 4.09202C5 4.51984 5 5.0799 5 6.2V17.8C5 18.9201 5 19.4802 5.21799 19.908C5.40973 20.2843 5.71569 20.5903 6.09202 20.782C6.51984 21 7.0799 21 8.2 21H15M13 3L19 9M13 3V7.4C13 7.96005 13 8.24008 13.109 8.45399C13.2049 8.64215 13.3578 8.79513 13.546 8.89101C13.7599 9 14.0399 9 14.6 9H19M19 9V11"
              stroke="#000000"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />{' '}
          </g>
        </svg>
      </div>
    );
  };

  const getInputFileButton: any = () => {
    const chatbot = document.querySelector('flowise-chatbot');
    if (!!chatbot && !!chatbot.shadowRoot) {
      const chatBotDocument = chatbot.shadowRoot;
      const fileButton = chatBotDocument.getElementById('file_button');
      return fileButton;
    }
  };

  onMount(async () => {
    try {
      const response = await fetch(`https://upload-files-app.calmpond-81c5bb18.eastus.azurecontainerapps.io/config/${props.customerId}`);
      const config = await response.json();
      setIsEnabled(config.isEnabled);
      setFolderId(config.folderId);

      const inputFileButton = getInputFileButton();
      if (inputFileButton != null) {
        inputFileButton.addEventListener('change', (e: any) => {
          if (e.target.files[0]) {
            uploadFiles(e.target.files[0]);
          }
        });
        inputFileButton.addEventListener('click', () => {
          inputFileButton.value = null;
        });
      }
    } catch (err) {
      console.log(err);
    }
  });

  return (
    <Show when={isEnabled()}>
      <div>
        <input type="file" id="file_button" style={{ display: 'none' }} accept="image/*,video/*,.doc,.docx,.pdf" />
        {isUploading() ? getProgressBar() : getUpload()}
      </div>
    </Show>
  );
};
