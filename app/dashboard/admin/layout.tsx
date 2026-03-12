export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="admin-layout">
            <style dangerouslySetInnerHTML={{
                __html: `
        .admin-layout ~ footer { display: none !important; }
        header.fixed { display: none !important; }
        main.relative { padding-top: 0 !important; }
      `}} />
            {children}
        </div>
    );
}
