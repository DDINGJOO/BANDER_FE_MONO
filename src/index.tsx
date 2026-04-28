import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { ensureDeviceId } from './lib/deviceId';
import reportWebVitals from './reportWebVitals';

// PR-B: chat-v2 deviceId 운반. bander_device_id cookie 발행 + localStorage
// 캐시 동기화 → 이후 모든 REST/WS 가 자동 동봉되어 ChatHandshakeInterceptor
// 의 cookie source 가 안정적으로 deviceId 를 인식.
ensureDeviceId();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
