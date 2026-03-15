"use client";

import { type ComponentProps, useRef } from "react";

export function AutoSubmitSelect(props: ComponentProps<"select">) {
  const ref = useRef<HTMLSelectElement>(null);

  return (
    <select
      {...props}
      ref={ref}
      onChange={(e) => {
        props.onChange?.(e);
        window.gtag?.("event", "match_filter", { filter_type: props.name });
        ref.current?.form?.requestSubmit();
      }}
    />
  );
}
