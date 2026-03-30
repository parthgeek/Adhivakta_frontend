"use client"

import * as React from "react"
import { toast as sonnerToast } from "sonner"

const getToastMessage = (props = {}) => {
  if (props.title) return props.title
  if (props.description) return props.description
  return "Notification"
}

const getToastDescription = (props = {}) => {
  if (props.title && props.description) {
    return props.description
  }

  return undefined
}

function showToast(props = {}) {
  const message = getToastMessage(props)
  const description = getToastDescription(props)
  const method = props.variant === "destructive" ? sonnerToast.error : sonnerToast

  const toastId = method(message, {
    id: props.id,
    description,
    duration: props.duration,
    action: props.action,
    className: props.className,
  })

  return {
    id: toastId,
    dismiss: () => sonnerToast.dismiss(toastId),
    update: (nextProps = {}) =>
      showToast({
        ...props,
        ...nextProps,
        id: toastId,
      }),
  }
}

function useToast() {
  return React.useMemo(
    () => ({
      toasts: [],
      toast: showToast,
      dismiss: (toastId) => sonnerToast.dismiss(toastId),
    }),
    [],
  )
}

export { useToast, showToast as toast }
