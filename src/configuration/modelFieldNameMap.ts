import {
  WordFields,
  PhraseFields,
  CommonConfig,
  SentenceFields,
} from "@/extensions-api";

const WORD_FIELDS_MAP: WordFields = {
  definition: "定义",
  word: "单词",
  translation: "翻译",
  part_of_speech: "词性",
  form: "单词形式",
  definition_audio: "定义音频",
  am: "美国音标",
  en: "英国音标",
  am_audio: "美国音频",
  en_audio: "英国音频",
  star_amount: "出现频率",
  example_audio: "例句音频",
  example_sentence: "例句原文",
  example_sentence_translation: "例句翻译",
};

const PHRASE_FIELDS_MAP: PhraseFields = {
  phrase: "短语词组",
  phrase_audio: "短语音频",
  translations: "短语翻译",
  example_audio_1: "例句1音频",
  example_audio_2: "例句2音频",
  example_audio_3: "例句3音频",
  example_sentence_1: "例句1原文",
  example_sentence_2: "例句2原文",
  example_sentence_3: "例句3原文",
  example_sentence_translation_1: "例句1翻译",
  example_sentence_translation_2: "例句2翻译",
  example_sentence_translation_3: "例句3翻译",
};

const SENTENCE_FIELDS_MAP: SentenceFields = {
  sentence: "句子原文",
  sentence_audio: "句子音频",
  sentence_translation: "句子翻译",
};

const COMMON_CONFIG_MAP: CommonConfig = {
  deckName: "牌组名称",
  modelName: "模型名称",
  tags: "卡片标签",
};

const ANKI_CONNECTION_MAP = {
  ankiConnectionMethod: "连接方法",
  ankiConnectionURL: "连接URL",
};

if (__DEV__) {
  Object.freeze(WORD_FIELDS_MAP);
  Object.freeze(PHRASE_FIELDS_MAP);
  Object.freeze(SENTENCE_FIELDS_MAP);
  Object.freeze(COMMON_CONFIG_MAP);
  Object.freeze(ANKI_CONNECTION_MAP);
}

export {
  WORD_FIELDS_MAP,
  COMMON_CONFIG_MAP,
  PHRASE_FIELDS_MAP,
  SENTENCE_FIELDS_MAP,
  ANKI_CONNECTION_MAP,
};
