import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../services/auth";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const data = await loginUser(username, password);

      // Save JWT Token
      login(data.access);

      // Save username
      localStorage.setItem("username", username);

      alert("✅ Login Successful!");

      navigate("/");
    } catch (error) {
      console.error(error);
      alert("❌ Invalid Username or Password");
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "100px auto",
        padding: "30px",
        background: "#1F2937",
        borderRadius: "15px",
        color: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,.3)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "25px" }}>
        🚀 Login
      </h2>

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "10px",
            border: "none",
            outline: "none",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "10px",
            border: "none",
            outline: "none",
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            background: "#7C3AED",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;