import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-4xl font-bold text-foreground">FocusFlow</h1>
        <p className="text-lg text-muted-foreground">
          Organize your tasks with clarity and purpose
        </p>
        <div className="space-y-4">
          <Button 
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;