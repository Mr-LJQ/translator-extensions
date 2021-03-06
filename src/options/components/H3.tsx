import React from "react";
import classnames from "classnames";

type Props = React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>

/**
 * h3标签的UI封装
 * 依赖：tailwindcss
 */
function H3(props: Props) {
  const { children, className } = props;
  return (
    <h3
      className={classnames(
        "mb-1 py-1 px-2 rounded-t bg-blue-gray text-white text-lg",
        className
      )}
    >
      {children}
    </h3>
  );
}

export { H3 };
