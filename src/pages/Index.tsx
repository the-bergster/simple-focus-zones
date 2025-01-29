import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex flex-col items-center">
          <img 
            src="https://media.ceros.com/simonberg/images/2025/01/29/59048511c0a9813e16f2a9713a2c49a9/logo.png" 
            alt="FocusFlow Logo" 
            className="h-16 mb-6"
          />
        </div>
        <p className="text-lg text-muted-foreground">
          Organize your tasks with clarity and purpose
        </p>
        <div className="space-y-4">
          <Button 
            className="w-full bg-primary hover:bg-primary/90"
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