import pick from "lodash.pick";
import { Storage, TabPanelName, PartialStorage } from "./types";

//缓存默认值对象，用于在用户刚刚加载拓展，没有进行任何配置时作为初始配置。
//确保 Storage 中的缓存无论何时都是符合要求的，不存在刚刚加载插件时因为 Storage 为空而导致的问题。
const defaultStorage: Storage = {
  isOpen: true,
  hotKey: "shiftKey",
  openSelection: true,
  hiddenChinese: false,
  checkedTabPanel: TabPanelName.Home,
  ankiConnectionMethod: "AnkiConnection",
  ankiConnectionURL: "http://127.0.0.1:8765",
  openStrengthenSelectionByPressedCtrl: true,
  wordConfig: {},
  phraseConfig: {},
  sentenceConfig: {},

  checkWordDuplicate: {
    word: true,
    deckName: true,
    definition: true,
    translation: true,
  },
  checkPhraseDuplicate: {
    phrase: true,
    deckName: true,
  },
  checkSentenceDuplicate: {
    deckName: true,
    sentence: true,
  },
};

type StorageKeys = keyof Storage;

type StorageHandlers<T extends PartialStorage> = {
  [P in keyof T]?: (value: T[P]) => void;
};

type StorageToCallback<T extends PartialStorage> = {
  [P in keyof T]?: (oldVal: T[P], newVal: T[P]) => void;
};

type GetStorageCallback = (storage: PartialStorage) => void;

function handlersIsArray(
  handlers: StorageHandlers<Storage> | StorageKeys[]
): handlers is StorageKeys[] {
  return Array.isArray(handlers);
}

function getStorage(
  handlers: StorageKeys[],
  callback: GetStorageCallback
): void;
function getStorage(
  handlers: StorageHandlers<Storage>,
  callback?: GetStorageCallback
): void;
function getStorage(
  handlers: StorageHandlers<Storage> | StorageKeys[],
  callback?: GetStorageCallback
) {
  const storageKeys = handlersIsArray(handlers)
    ? handlers
    : (Object.keys(handlers) as StorageKeys[]);
  const storage = pick(defaultStorage, storageKeys);
  chrome.storage.local.get(storage, (storage: PartialStorage) => {
    if (!handlersIsArray(handlers)) {
      Object.keys(storage).forEach((key) => {
        const handler = handlers[key as StorageKeys];
        const cacheValue = storage[key as StorageKeys];
        //@ts-ignore 是匹配的值
        handler?.(cacheValue);
      });
    }
    callback?.(storage);
  });
}

export function getStorageByArray(
  names: StorageKeys[],
  callback: (storage: PartialStorage) => void
) {
  getStorage(names, callback);
}

export function getStorageByObject(
  handlers: StorageHandlers<Storage>,
  callback?: GetStorageCallback
) {
  getStorage(handlers, callback);
}

export function onStorageChange(handlers: StorageToCallback<Storage>) {
  const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
    changes
  ) => {
    Object.keys(changes).forEach((key) => {
      const handler = handlers[key as StorageKeys];
      if (handler) {
        const { oldValue, newValue } = changes[key]!;
        //@ts-ignore 是正确匹配的
        handler(oldValue, newValue);
      }
    });
  };
  chrome.storage.onChanged.addListener(listener);
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

export function setStorage(
  partialStorage: PartialStorage,
  callback?: () => void
) {
  chrome.storage.local.set(partialStorage, callback);
}
