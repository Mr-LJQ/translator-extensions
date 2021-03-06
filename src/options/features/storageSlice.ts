import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PhraseConfig, SentenceConfig, Storage, WordConfig, BasisConfig } from '../../../types'
import { getStorageItems } from '../../extensions_API/storage'

const name = "storage"

const initialState: Storage = {}

const fetchStorage = createAsyncThunk(name + "/fetchStorage", async () => {
  return getStorageItems([
    "wordConfig",
    "phraseConfig",
    "sentenceConfig",
    "ankiConnectionMethod",
    "ankiConnectionURL",
    "activeTabPane",
  ])
})

const storageSlice = createSlice({
  name,
  initialState,
  reducers: {
    updateWordConfig(state, action: PayloadAction<{ name: keyof WordConfig, value: string }>) {
      const { name, value } = action.payload
      if (!state.wordConfig) state.wordConfig = {}
      state.wordConfig[name] = value
    },
    updatePhraseConfig(state, action: PayloadAction<{ name: keyof PhraseConfig, value: string }>) {
      const { name, value } = action.payload
      if (!state.phraseConfig) state.phraseConfig = {}
      state.phraseConfig[name] = value
    },
    updateSentenceConfig(state, action: PayloadAction<{ name: keyof SentenceConfig, value: string }>) {
      const { name, value } = action.payload
      if (!state.sentenceConfig) state.sentenceConfig = {}
      state.sentenceConfig[name] = value
    },
    updateBasisConfig(state, action: PayloadAction<{ name: keyof BasisConfig, value: string }>) {
      const { name, value } = action.payload
      state[name] = value
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchStorage.fulfilled, (state, action) => {
      return action.payload
    })
  }
})

const { updateBasisConfig, updatePhraseConfig, updateSentenceConfig, updateWordConfig } = storageSlice.actions
export default storageSlice.reducer
export {
  fetchStorage,
  updateWordConfig,
  updateBasisConfig,
  updatePhraseConfig,
  updateSentenceConfig,
}