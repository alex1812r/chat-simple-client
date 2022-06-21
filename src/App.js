import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button, Form } from 'react-bootstrap';
import io from "socket.io-client";
import moment from 'moment';
import './App.css'
import logo from './logo.svg';

const socket = io.connect(process.env.REACT_APP_SERVER_URL);

const AuthorForm = ({ onSubmit }) => {
  const inputEl = useRef(null);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit(inputEl.current.value.trim().toLowerCase());
  }, [onSubmit]);

  return (
    <div className="App d-flex align-items-center justify-content-center">
      <Form onSubmit={handleSubmit}>
        <div className="card m-auto" style={{ width: 350, textAlign: 'start' }}>
          <div className="card-body">
            <Form.Label>Username *</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="type your username" 
              ref={inputEl}
            />
            
            <Button 
              className="mt-3 ms-auto d-block" 
              variant="info"
              type="submit">
              Enter
            </Button>
          </div>
        </div>
      </Form>
    </div>
  )
}

function App() {
  const [author, setAuthor] = useState(null);
  const inputEl = useRef(null);
  const [messages, setMessages] = useState([]);

  const content = useMemo(() => {
    console.log('msg');
    return messages
      .sort((a, b) => {
        return new Date(a.createdAt) - new Date(b.createdAt);
      })
      .map((msg) => (
      <div key={msg._id} className={`message ${author === msg.author ? 'my-message': ''}`}>
        <span className="message-author">
          {msg.author}
        </span>
        <div className="message-content">
          {msg.content}
        </div>
        <span className="message-date">
          {moment(msg.createdAt).fromNow()}
        </span>
      </div>
    ))
  }, [messages, author]);

  const handleOnSubmit = useCallback((e) => {
    e.preventDefault();
    socket.emit("send_message", { 
      content: inputEl.current.value,
      author: author,
    });

    inputEl.current.value = '';
  }, [author]);

  useEffect(() => {
    if(author) {
      fetch(process.env.REACT_APP_SERVER_URL + '/messages')
        .then((res) => res.json())
        .then((data) => {
          setMessages(data.messages);
        })
        .catch((err) => console.error(`error getting old messages ${JSON.stringify(err)}`))
      
      const listener = (msg) => {
        setMessages((prevState) => prevState.concat([msg]))
      };
      
      socket.on("received_message", listener);
      
      return () => socket.off("received_message", listener);
    }
  }, [author]);

  if(!author) return <AuthorForm onSubmit={(val) => setAuthor(val)} />

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>
      <main className="position-absolute bottom-0 w-100 h-100">
        <div className="d-flex flex-column justify-content-end h-100 m-auto" style={{ maxWidth: 800 }}>
          <div className="overflow-auto">
            {content}
          </div>
          <div style={{ marginBottom: 50 }}></div>
          {/* <div className="flex-grow-1" style={{ height: 0 }}>
            <div className="h-100 overflow-auto d-flex flex-column justify-content-end">
              {content}
            </div>
          </div> */}
          <div className="position-fixed bottom-0" style={{ width: 800 }}>
            <Form onSubmit={handleOnSubmit}>
              <div className="d-flex flex-nowrap">
                <Form.Control 
                  ref={inputEl}
                  type="text" 
                  placeholder="type your message" 
                />
                <Button type="submit" variant="info">
                  Send
                </Button>
              </div>
            </Form>
          </div>
        </div>
        
      </main>
    </div>
  );
}

export default App;
