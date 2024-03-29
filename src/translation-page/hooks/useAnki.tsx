import { useCallback, useRef, useState } from "react";
import { produce } from "immer";

import { warning } from "@/utils";
import { Command } from "@/configuration";
import { isAnkiResponseError } from "@/anki";
import { useMessenger } from "../components/Context";
import { transformAnkiResponseStatus, __main__ } from "../utils";
import {
  Status,
  NoteData,
  AnkiButtonInfoObject,
  AnkiButtonInfo,
} from "../types";
import { TabPanelName } from "@/extensions-api";

interface AnkiParams {
  loadingSet: Set<string>;
}

/**
 * 该部分主要封装的是与 Anki间的互操作逻辑
 */
export function useAnki(params: AnkiParams) {
  const [ankiButtonInfoObject, setAnkiButtonInfoObject] =
    useState<AnkiButtonInfoObject>({
      //在使用前会进行赋值
      [__main__]: null!,
    });
  const { loadingSet } = params;
  const { postMessage } = useMessenger();
  const ankiButtonInfoObjectRef = useRef(ankiButtonInfoObject);
  ankiButtonInfoObjectRef.current = ankiButtonInfoObject;

  const submit = useCallback(
    function (data: NoteData, key: string | typeof __main__, idx: number) {
      const ankiButtonInfoObject = ankiButtonInfoObjectRef.current;
      //先有相应的数据可以被用户看到，用户的操作才会触发该函数，因此可以断言非空。
      const ankiButtonInfo = ankiButtonInfoObject[key]![idx]!;
      const { status } = ankiButtonInfo;
      const prevStatus = status;
      const symbol = `${String(key)}+${idx}`;
      const tabPanelName = getTabPanelName(data);

      setAnkiButtonInfoObject(function (ankiButtonInfoObject) {
        loadingSet.add(symbol);
        return produce(ankiButtonInfoObject, (draft) => {
          //先有相应的数据可以被用户看到，用户的操作才会触发该函数，因此可以断言非空。
          draft[key]![idx]!.status = Status.Loading;
          draft[key]![idx]!.message = "请等待...";
          //只有在该次提交是有效提交，而非错误重试的时候，才更新 lastUsefulSubmission
          if (isUsefulStatus(status)) {
            draft[key]![idx]!.lastUsefulSubmission = status;
          }
        });
      });

      const strategies = {
        [Status.Add]: addNew,
        [Status.Duplicate]: addNew,
        [Status.ConfigError]: addNew,
        [Status.Forgotten]: refresh,
        [Status.LearnNow]: refresh,
        [Status.Disconnect]: selectPreviousHandler(ankiButtonInfo),
        [Status.Error]: selectPreviousHandler(ankiButtonInfo),
        [Status.Loading]: throwError(Status.Loading),
        [Status.Success]: throwError(Status.Success),
      };
      return strategies[status]();

      /**
       * 选择上一次有效提交的处理函数
       */
      function selectPreviousHandler(ankiButtonInfo: AnkiButtonInfo) {
        const { lastUsefulSubmission } = ankiButtonInfo;
        return lastUsefulSubmission === Status.Add ? addNew : refresh;
      }

      /**
       * 刷新已有卡片学习进度的逻辑
       */
      function refresh() {
        //在设计上，进入函数时，必定存在 cardIds
        const cardIds = ankiButtonInfo.cardIds!;
        postMessage(Command.RelearnNote, cardIds, function (ankiResponse) {
          const { status, message } = ankiResponse;
          setAnkiButtonInfoObject(function (ankiButtonInfoObject) {
            loadingSet.delete(symbol);
            return produce(ankiButtonInfoObject, (draft) => {
              if (!isAnkiResponseError(ankiResponse)) {
                draft[key]![idx]!.cardIds = ankiResponse.data;
              }
              draft[key]![idx]!.message = message;
              draft[key]![idx]!.status = transformAnkiResponseStatus(status)!;
            });
          });
        });
      }

      /**
       *添加新卡片的逻辑
       */
      function addNew() {
        postMessage(Command.AddNote, data, function (ankiResponse) {
          const { message, status } = ankiResponse;
          const newStatus = transformAnkiResponseStatus(status);
          /**
           * 这里实现一个功能，当出现配置错误时，
           *  在配置错误被用户修正前，用户点击按钮都会打开配置页面
           *  在修正后，用户点击按钮则会重新添加卡片。
           */
          if (isTwiceConfigError(prevStatus, newStatus)) {
            postMessage(Command.OpenOptionsPage, tabPanelName);
          }

          /**
           * 如果是重复，则第二次点击会复制一份利于在Anki上查找重复卡片的搜索字符
           *  如果重复已处理，则进行重试，不会复制。
           */
          if (isTwiceDuplicate(prevStatus, newStatus)) {
            !isAnkiResponseError(ankiResponse) &&
              writeClipboard(ankiResponse.data);
          }

          setAnkiButtonInfoObject(function (ankiButtonInfoObject) {
            loadingSet.delete(symbol);
            return produce(ankiButtonInfoObject, (draft) => {
              draft[key]![idx]!.message = message;
              if (!isAnkiResponseError(ankiResponse)) {
                draft[key]![idx]!.cardIds = ankiResponse.data;
              }
              draft[key]![idx]!.status = newStatus;
            });
          });
        });
      }
    },
    [loadingSet, postMessage, setAnkiButtonInfoObject]
  );
  return {
    submit,
    ankiButtonInfoObject,
    setAnkiButtonInfoObject,
  };
}

function getTabPanelName(data: NoteData) {
  if ("word" in data) return TabPanelName.Word;
  if ("phrase" in data) return TabPanelName.Phrase;
  if ("sentence" in data) return TabPanelName.Sentence;
  warning(false, "getTabPanelName 方法无法正确映射到 TabPanelName.");
  return TabPanelName.Home;
}

function isUsefulStatus(status: Status) {
  return {
    [Status.Add]: true,
    [Status.LearnNow]: true,
    [Status.Forgotten]: true,
    //无用的状态
    [Status.Error]: false,
    [Status.Success]: false,
    [Status.Loading]: false,
    [Status.Duplicate]: false,
    [Status.Disconnect]: false,
    [Status.ConfigError]: false,
  }[status];
}

function throwError(status: Status.Loading | Status.Success) {
  const statusMap = {
    [Status.Loading]: "Status.Loading",
    [Status.Success]: "Status.Success",
  };
  const state = statusMap[status];
  return () => {
    throw new Error(
      `${state} 状态应被过滤掉，在设计上，处于该状态时应该不能够触发 submit 调用。`
    );
  };
}

function writeClipboard(data: number[]) {
  const queryText = data
    .map((item) => {
      return "cid:" + item;
    })
    .join(" OR ");
  navigator.clipboard.writeText(queryText);
}

function isTwiceDuplicate(prevStatus: Status, newStatus: Status) {
  return prevStatus === Status.Duplicate && newStatus === Status.Duplicate;
}

function isTwiceConfigError(prevStatus: Status, newStatus: Status) {
  return prevStatus === Status.ConfigError && newStatus === Status.ConfigError;
}
