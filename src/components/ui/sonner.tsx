import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        style: {
          backgroundColor: '#1a1a1a',
          border: '2px solid #4a4a4a',
          borderRadius: '12px',
          color: '#fff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
          padding: '12px 16px',
        },
        classNames: {
          success: 'toast-success',
          error: 'toast-error',
          warning: 'toast-warning',
          info: 'toast-info',
        },
      }}
      style={
        {
          "--normal-bg": "#1a1a1a",
          "--normal-text": "#fff",
          "--normal-border": "#4a4a4a",
          "--border-radius": "12px",
          "--success-bg": "#1a1a1a",
          "--success-border": "#10b981",
          "--error-bg": "#1a1a1a",
          "--error-border": "#ef4444",
          "--warning-bg": "#1a1a1a",
          "--warning-border": "#facc15",
          "--info-bg": "#1a1a1a",
          "--info-border": "#3b82f6",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
