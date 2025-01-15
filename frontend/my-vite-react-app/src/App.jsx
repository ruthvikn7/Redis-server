import { Routes, Route, BrowserRouter } from "react-router-dom";
import Form from './Components/Form';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/test" element={<Form />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
