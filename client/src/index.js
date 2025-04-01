import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes, Navigate, useParams } from "react-router-dom";
import "assets/vendor/nucleo/css/nucleo.css";
import "assets/vendor/font-awesome/css/font-awesome.min.css";
import "assets/scss/argon-design-system-react.scss?v1.1.0";
import Index from "views/Index.js";
import Login from "views/examples/Login.js";
import Register from "views/examples/Register.js";
import Wo from "views/pages/wo";
import Upload from "views/pages/upload";

import PrivateRoute from "views/PrivateRoute.js";
// Import createStore and AuthProvider from react-auth-kit
import createStore from "react-auth-kit/createStore";
import AuthProvider from "react-auth-kit";

const root = ReactDOM.createRoot(document.getElementById("root"));

// Create the store
const UploadPageWrapper = () => {
  const { requestId } = useParams();
  return <Upload requestId={requestId} />;
};
const store = createStore({
  authName: "_auth",
  authType: "cookie",
  cookieDomain: window.location.hostname,
  cookieSecure: window.location.protocol === "http:",
});

root.render(
  <AuthProvider store={store}>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login-page" element={<Login />} />
        <Route path="/register-page" element={<Register />} />
        <Route path="/wo-page" element={<PrivateRoute element={<Wo />} />} />
        <Route path="/upload-page/:requestId" element={<PrivateRoute element={<UploadPageWrapper />} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </AuthProvider>
);
