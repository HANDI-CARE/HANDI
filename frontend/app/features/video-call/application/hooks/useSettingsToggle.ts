/*
 * 25.08.02 kykint
 * https://github.com/livekit/components-js 의 컴포넌트를 기반으로 제작함
 */

import { useLayoutContext } from "@livekit/components-react";
import * as React from "react";
import { mergeProps } from "~/shared/utils/mergeProps";

/** @alpha */
export interface UseSettingsToggleProps {
  props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

/**
 * The `useSettingsToggle` hook provides state and functions for toggling the settings menu.
 * @remarks
 * Depends on the `LayoutContext` to work properly.
 * @see {@link SettingsMenu}
 * @alpha
 */
export function useSettingsToggle({ props }: UseSettingsToggleProps) {
  const { dispatch, state } = useLayoutContext().widget;
  const className = "lk-button lk-settings-toggle";

  const mergedProps = React.useMemo(() => {
    return mergeProps(props, {
      className,
      onClick: () => {
        if (dispatch) dispatch({ msg: "toggle_settings" });
      },
      "aria-pressed": state?.showSettings ? "true" : "false",
    });
  }, [props, className, dispatch, state]);

  return { mergedProps };
}
