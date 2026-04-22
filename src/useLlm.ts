import { NativeModules } from 'react-native';

const { LlmModule } = NativeModules;

export const initModel = (backend: 'CPU' | 'GPU') => {
  return LlmModule.loadModel(backend);
};

export async function askLlm(prompt: string): Promise<string> {
  const response = await LlmModule.generate(prompt);
  return response;
}

export const unloadModel = () => {
  return LlmModule.unloadModel();
};
