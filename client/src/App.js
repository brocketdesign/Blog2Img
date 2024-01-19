import React, { useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState([]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/generateImages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setResult(data); // Assuming the response is in the responsePayload array
        } catch (error) {
            console.error('Error fetching data:', error);
            setResult([]); // Reset the result or handle the error gracefully
        }

        setIsLoading(false);
    };

    return (
        <div className="App">
            <header className="App-header text-center">
                <h1>Blog2Img</h1>
                <p>Transform blog articles into insightful visual summaries.</p>
            </header>
            <main className="container-fluid p-0" style={{ minHeight: '100vh' }}>
                <div className="sticky-top bg-white">
                    <form onSubmit={handleSubmit} className="text-center p-3">
                        <div className="mb-3">
                            <input className="form-control" type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter article URL" />
                        </div>
                        <button className="btn btn-primary" type="submit">Generate</button>
                    </form>
                </div>
                <div className="result-container text-center p-3">
                    {isLoading && <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>}
                    {result && result.map((item, index) => (
                        <div key={index} className="result-section mb-4">
                            <img src={item.image} alt="Generated" className="img-fluid" />
                            <p><strong>Catchphrase:</strong> {item.catchphrase}</p>
                            <p><strong>Summary:</strong> {item.summary}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

export default App;
