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
    <div className={`${className}`}>
      <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-dashed border-yellow-500/50">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
              Google AdSense
            </Badge>
          </div>
          
          <div className="text-sm text-slate-300 mb-2">
            <strong>{dimensions.name}</strong>
          </div>
          
          <div className="text-xs text-slate-400 mb-2">
            Posição: {position}
          </div>
          
          <div className="text-xs text-slate-400 mb-3">
            Dimensões: {dimensions.width} x {dimensions.height}
          </div>
          
          <div className="flex justify-center gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Monitor className="w-3 h-3" />
              Desktop
            </div>
            <div className="flex items-center gap-1">
              <Tablet className="w-3 h-3" />
              Tablet
            </div>
            <div className="flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              Mobile
            </div>
          </div>
          
          <div className="mt-3 p-4 bg-slate-800/50 rounded border-2 border-dashed border-slate-600" 
               style={{ 
                 minWidth: format === "responsive" ? "100%" : dimensions.width,
                 minHeight: format === "responsive" ? "200px" : dimensions.height,
                 maxWidth: "100%"
               }}>
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Anúncio Google AdSense<br />
              {dimensions.name}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}