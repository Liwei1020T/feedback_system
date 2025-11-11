import { PropsWithChildren, CSSProperties } from "react";

interface CardProps extends PropsWithChildren {
  className?: string;
  style?: CSSProperties;
}

interface CardBodyProps extends PropsWithChildren {
  className?: string;
}

export const Card = ({ children, className = "", style }: CardProps) => (
  <div className={`glass-card p-6 hover:shadow-soft transition-shadow duration-300 animate-scale-in ${className}`} style={style}>{children}</div>
);

export const CardTitle = ({ children }: PropsWithChildren) => (
  <h2 className="text-lg font-bold mb-4 text-slate-800">{children}</h2>
);

export const CardBody = ({ children, className = "" }: CardBodyProps) => <div className={className}>{children}</div>;
