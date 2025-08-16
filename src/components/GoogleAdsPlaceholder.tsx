import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Tablet } from "lucide-react";

interface GoogleAdsPlaceholderProps {
  format: string;
  position: string;
  className?: string;
}

export default function GoogleAdsPlaceholder({ format, position, className = "" }: GoogleAdsPlaceholderProps) {
  const getAdDimensions = (format: string) => {
    switch (format) {
      case "leaderboard":
        return { width: "728px", height: "90px", name: "Leaderboard" };
      case "banner":
        return { width: "468px", height: "60px", name: "Banner" };
      case "rectangle":
        return { width: "300px", height: "250px", name: "Retângulo Médio" };
      case "skyscraper":
        return { width: "160px", height: "600px", name: "Arranha-céu" };
      case "mobile_banner":
        return { width: "320px", height: "50px", name: "Banner Mobile" };
      case "large_mobile_banner":
        return { width: "320px", height: "100px", name: "Banner Mobile Grande" };
      case "responsive":
        return { width: "100%", height: "auto", name: "Responsivo" };
      default:
        return { width: "300px", height: "250px", name: "Padrão" };
    }
  };

  const dimensions = getAdDimensions(format);
  
  return (
    <div className={`w-full max-w-full mx-auto ${className}`}>
      <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-dashed border-yellow-500/50">
        <CardContent className="p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
              Google AdSense
            </Badge>
          </div>
          
          <div className="text-xs text-slate-300 mb-1">
            <strong>{dimensions.name}</strong>
          </div>
          
          <div className="text-xs text-slate-400 mb-1">
            {position}
          </div>
          
          <div className="text-xs text-slate-500 mb-2">
            {dimensions.width} x {dimensions.height}
          </div>
          
          <div className="p-2 bg-slate-800/50 rounded border border-dashed border-slate-600 text-center" 
               style={{ 
                 width: format === "responsive" ? "100%" : "auto",
                 minHeight: "40px",
                 maxWidth: "100%"
               }}>
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              Anúncio {dimensions.name}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}