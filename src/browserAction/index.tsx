import React, { ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";

import {
  TabPaneKey,
  setStorage,
  getStorage,
  openOptionsPage,
  onStorageChange,
} from "../utils/extensions-api";

import { SwitchButton } from "./SwitchButton";

////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
//声明
import type { Storage } from "../utils/extensions-api";
type State = Pick<Storage, "hotKey" | "isOpen">;

class Popup extends React.Component<{}, State> {
  state: State = {
    isOpen:true,
    hotKey:"shiftKey"
  };

  hotkeys: Array<Storage["hotKey"]> = [
    undefined,
    "shiftKey",
    "ctrlKey",
    "altKey",
  ];

  constructor(props: {}) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.openOptionsPage = this.openOptionsPage.bind(this);
    this.handleSwitchOpen = this.handleSwitchOpen.bind(this);
  }
  componentDidMount() {
    getStorage(["isOpen", "hotKey"], ({ isOpen, hotKey }) => {
      this.setState({ isOpen, hotKey });
    });
    onStorageChange({
      isOpen: (_, isOpen) => this.setState({ isOpen: isOpen }),
      hotKey: (_, hotKey) => this.setState({ hotKey: hotKey }),
    });
  }
  openOptionsPage() {
    setStorage({ activeTabPane: TabPaneKey.Home }, () => {
      openOptionsPage();
    });
  }
  handleSwitchOpen() {
    let { isOpen } = this.state;
    isOpen = !isOpen;
    this.setState({ isOpen });
    setStorage({ isOpen });
  }
  handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const hotKey = event.target.value as Storage["hotKey"];
    this.setState({ hotKey });
    setStorage({ hotKey });
  }
  render() {
    const { hotKey, isOpen } = this.state;
    return (
      <>
        <header
          className="
            font-bold
            text-xl 
            text-white
            p-1
            border
            rounded-tr-sm
            bg-blue-gray
          "
        >
          Options
          <span
            className="
              float-right
              mr-1
              cursor-pointer
            "
            onClick={this.openOptionsPage}
          >
            ...
          </span>
        </header>
        <main
          className="
            bg-gray-200 
            rounded-tl-sm
         "
        >
          <div
            className="
              flex
              items-center
              justify-between
              p-1 
            "
          >
            <span className="text-lg">开关插件</span>
            <SwitchButton isOpen={!!isOpen} onClick={this.handleSwitchOpen} />
          </div>
          <div
            className="
              flex
              items-center
              justify-between
              p-1 
            "
          >
            <span className="text-lg">取词热键</span>
            <select
              className="rounded h-8 w-20"
              value={hotKey}
              onChange={this.handleChange}
            >
              {this.hotkeys.map((hotKey, index) => {
                if (!hotKey) return <option value="" key="default"></option>;
                return (
                  <option value={hotKey} key={index}>
                    {hotKey
                      .slice(0, -3)
                      .replace(/^[a-z]/gi, (letter) => letter.toUpperCase())}
                  </option>
                );
              })}
            </select>
          </div>
        </main>
      </>
    );
  }
}

const root = document.getElementById("root")!;
root.classList.add("w-44", "m-1", "text-sm");
createRoot(root).render(<Popup />);
