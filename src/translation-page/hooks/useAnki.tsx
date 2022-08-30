import React, { useCallback, useRef } from "react";
import { produce } from "immer";

import { warning } from "@/utils";
import { Command } from "@/configuration";
import { useMessenger } from "../components/Context";
import { transformAnkiResponseStatus, __main__ } from "../utils";
import { Status, NoteData, AnkiButtonInfoObject } from "../types";

interface AnkiParams {
  loadingSet: Set<string>;
  ankiButtonInfoObject: AnkiButtonInfoObject;
  setAnkiButtonInfoObject: React.Dispatch<
    React.SetStateAction<AnkiButtonInfoObject>
  >;
}

/**
 * 该部分主要封装的是与 Anki间的互操作逻辑
 */
export function useAnki(params: AnkiParams) {
  const { postMessage } = useMessenger();
  const { ankiButtonInfoObject, setAnkiButtonInfoObject, loadingSet } = params;
  const ankiButtonInfoObjectRef = useRef(ankiButtonInfoObject);
  ankiButtonInfoObjectRef.current = ankiButtonInfoObject;

  const submit = useCallback(
    function (data: NoteData, key: string | typeof __main__, idx: number) {
      const ankiButtonInfoObject = ankiButtonInfoObjectRef.current;
      //先有相应的数据可以被用户看到，用户的操作才会触发该函数，因此可以断言非空。
      const ankiButtonInfo = ankiButtonInfoObject[key]![idx]!;
      const symbol = `${String(key)}+${idx}`;

      setAnkiButtonInfoObject(function (ankiButtonInfoObject) {
        loadingSet.add(symbol);
        return produce(ankiButtonInfoObject, (draft) => {
          //先有相应的数据可以被用户看到，用户的操作才会触发该函数，因此可以断言非空。
          draft[key]![idx]!.status = Status.Loading;
          draft[key]![idx]!.message = "请等待...";
          //只有在该次提交是有效提交，而非错误重试的时候，才更新 lastUsefulSubmission
          if (
            status === Status.Add ||
            status === Status.Forgotten ||
            status === Status.LearnNow
          ) {
            draft[key]![idx]!.lastUsefulSubmission = status;
          }
          warning(
            status === Status.Add ||
              status === Status.Forgotten ||
              status === Status.ConfigError ||
              status === Status.Duplicate ||
              status === Status.Disconnect ||
              status === Status.Error ||
              status === Status.LearnNow ||
              status === Status.Loading ||
              status === Status.Success,
            "存在新增的 Status 没有处理，请添加处理"
          );
        });
      });

      const { status } = ankiButtonInfo;
      const prevStatus = status
      switch (status) {
        case Status.Add:
        case Status.Duplicate:
        case Status.ConfigError:
          return AddNew();
        case Status.Forgotten:
        case Status.LearnNow:
          return refresh();
        case Status.Disconnect:
        case Status.Error: {
          const { lastUsefulSubmission } = ankiButtonInfo;
          if (lastUsefulSubmission === Status.Add) {
            return AddNew();
          } else {
            return refresh();
          }
        }
        default: {
          warning(false, "存在新增的 Status 没有处理，请添加处理");
        }
      }

      //处理重置学习进度的逻辑

      /**
       * 刷新已有卡片学习进度的逻辑
       */
      function refresh() {
        //在设计上，进入函数时，必定存在 cardIds
        const cardIds = ankiButtonInfo.cardIds!;
        postMessage(Command.RelearnNote, cardIds, function (ankiResponse) {
          const { status, message, data } = ankiResponse;
          setAnkiButtonInfoObject(function (ankiButtonInfoObject) {
            loadingSet.delete(symbol);
            return produce(ankiButtonInfoObject, (draft) => {
              draft[key]![idx]!.message = message;
              draft[key]![idx]!.cardIds = data || ankiButtonInfo.cardIds;
              //transformAnkiResponseStatus 保证不为undefined，有开发时的报错保护，以及相关单元测试进行保证
              draft[key]![idx]!.status = transformAnkiResponseStatus(status)!;
            });
          });
        });
      }

      /**
       *添加新卡片的逻辑
       */
      function AddNew() {
        postMessage(Command.AddNote, data, function (ankiResponse) {
          const { message, status, data } = ankiResponse;
          //transformAnkiResponseStatus 保证不为undefined，有开发时的报错保护，以及相关单元测试进行保证
          const newStatus = transformAnkiResponseStatus(status)!;
          /**
           * 这里实现一个功能，当出现配置错误时，
           *  在配置错误被用户修正前，用户点击按钮都会打开配置页面
           *  在修正后，用户点击按钮则会重新添加卡片。
           */
          if (prevStatus === Status.ConfigError && newStatus === Status.ConfigError) {
            postMessage(Command.OpenOptionsPage)
          }

          setAnkiButtonInfoObject(function (ankiButtonInfoObject) {
            loadingSet.delete(symbol);
            return produce(ankiButtonInfoObject, (draft) => {
              draft[key]![idx]!.message = message;
              draft[key]![idx]!.cardIds = data || ankiButtonInfo.cardIds;
              draft[key]![idx]!.status = newStatus;
            });
          });
        });
      }
    },
    [loadingSet, postMessage, setAnkiButtonInfoObject]
  );
  return submit;
}