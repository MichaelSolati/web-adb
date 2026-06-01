import React, { useState } from 'react';

interface HeaderProps {
  connected: boolean;
  status: string;
  statusClass: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onScreenshot: () => void;
  onToggleStream: () => void;
  isStreaming: boolean;
  onSendText: (text: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  connected,
  status,
  statusClass,
  onConnect,
  onDisconnect,
  onScreenshot,
  onToggleStream,
  isStreaming,
  onSendText,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText) {
      onSendText(inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <header>
      <h1>WebADB Screen</h1>
      <div id="controls">
        <button id="btn-connect" onClick={onConnect} disabled={connected}>
          Connect Device
        </button>
        <button id="btn-screenshot" onClick={onScreenshot} disabled={!connected}>
          Screenshot
        </button>
        <button
          id="btn-stream"
          onClick={onToggleStream}
          disabled={!connected}
          className={isStreaming ? 'streaming' : ''}
        >
          {isStreaming ? 'Stop Stream' : 'Start Stream'}
        </button>
        <button id="btn-disconnect" onClick={onDisconnect} disabled={!connected}>
          Disconnect
        </button>
      </div>
      <div id="text-input-row">
        <input
          id="txt-send"
          type="text"
          placeholder="Type text to send…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!connected}
        />
        <button id="btn-send" onClick={handleSend} disabled={!connected || !inputText}>
          Send
        </button>
      </div>
      <div id="status" className={statusClass}>
        {status}
      </div>
    </header>
  );
};

export default Header;
