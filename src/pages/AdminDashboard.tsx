import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentUploader from "@/components/admin/DocumentUploader";
import DocumentManager from "@/components/admin/DocumentManager";
import UserManager from "@/components/admin/UserManager";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboard() {
  return (
    <main className="container mx-auto py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard do Administrador</h1>
        <p className="text-muted-foreground">Gerencie documentos e usuários</p>
      </header>

      <Tabs defaultValue="docs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Upload de Documentos</h2>
            <DocumentUploader onUploaded={() => {/* could refresh via events */}} />
          </section>
          <Separator />
          <section>
            <DocumentManager />
          </section>
        </TabsContent>

        <TabsContent value="users">
          <UserManager />
        </TabsContent>
      </Tabs>
    </main>
  );
}
