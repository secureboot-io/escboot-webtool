import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// import reportWebVitals from './reportWebVitals';
import { NextUIProvider } from "@nextui-org/react";
// import { Provider } from 'react-redux';
import { LogProvider } from './LogProvider';
import StoreProvider from './StoreProvider';

const rootElement = document.getElementById("root")

const root = ReactDOM.createRoot(rootElement!);
root.render(
  <NextUIProvider>
    <LogProvider>
      <StoreProvider>
        <main className="dark text-foreground bg-background flex flex-row">
          <App />
        </main>
      </StoreProvider>
    </LogProvider>
  </NextUIProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
