import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  AppState,
  StatusBar,
} from 'react-native';
import { initModel, askLlm, unloadModel } from './src/useLlm';

export default function App() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [backend, setBackend] = useState<'CPU' | 'GPU'>('CPU');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const appState = useRef(AppState.currentState);

  const load = async (type: 'CPU' | 'GPU') => {
    try {
      setReady(false);
      await initModel(type);
      setReady(true);
    } catch (e: any) {
      if (type === 'GPU') {
        console.log('GPU failed → fallback CPU');
        setBackend('CPU');
        await load('CPU');
      }
    }
  };

  useEffect(() => {
    load(backend);
  }, [backend]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async nextState => {
      if (appState.current === 'active' && nextState === 'background') {
        await unloadModel();
        setReady(false);
      }

      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        await load(backend);
      }

      appState.current = nextState;
    });

    return () => sub.remove();
  }, [backend]);

  const send = async () => {
    if (!input.trim() || !ready) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg, { role: 'bot', text: '' }]);
    setInput('');
    setLoading(true);

    try {
      const res = await askLlm(input);
      console.log('Res', res);
      const fullText = res || '';
      let currentText = '';
      let index = 0;

      const interval = setInterval(() => {
        if (index >= fullText.length) {
          clearInterval(interval);
          setLoading(false);
          return;
        }

        currentText += fullText[index];

        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;

          updated[lastIndex] = {
            ...updated[lastIndex],
            text: currentText,
          };

          return updated;
        });

        index++;
      }, 20);
    } catch (e) {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.msg, isUser ? styles.user : styles.bot]}>
        <Text style={styles.text}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      {/* 🔥 Header */}
      <View style={styles.header}>
        <Text style={{ color: 'white' }}>
          {ready ? `Ready (${backend})` : 'Loading...'}
        </Text>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => setBackend('CPU')}>
            <Text style={styles.toggle}>CPU</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setBackend('GPU')}>
            <Text style={styles.toggle}>GPU</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
      />

      {loading && <Text style={styles.loading}>Thinking...</Text>}

      <View style={styles.inputBox}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask something..."
          placeholderTextColor="#999"
          style={styles.input}
        />

        <TouchableOpacity onPress={send} style={styles.send}>
          <Text style={{ color: 'white' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  header: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
  },

  toggle: {
    color: 'white',
    marginHorizontal: 8,
  },

  msg: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginVertical: 5,
  },

  user: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
  },

  bot: {
    alignSelf: 'flex-start',
    backgroundColor: '#334155',
  },

  text: {
    color: 'white',
  },

  inputBox: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },

  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: 'white',
    borderRadius: 10,
    paddingHorizontal: 10,
  },

  send: {
    marginLeft: 10,
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 10,
  },

  loading: {
    textAlign: 'center',
    color: '#94a3b8',
  },
});
