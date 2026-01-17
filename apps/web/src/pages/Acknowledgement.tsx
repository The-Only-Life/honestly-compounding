import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

const TERMS = [
  "I want to control my investments and assets",
  "I'm ready to spend 30 minutes in a quarter to review my investments and take action if necessary",
  "My investment horizon is over 5 years and I understand Wealth building takes time",
  "I'm not looking for get rich schemes & hot tips",
  "I do not believe day trading and technical trading builds wealth",
  "I understand markets are volatile and have patience to see through the volatility",
  "I do not get overly excited by rising markets"
];

const Acknowledgement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refetchUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(TERMS.length).fill(false));

  const allChecked = checkedItems.every(Boolean);

  const handleCheck = (index: number) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);
  };

  const handleContinue = async () => {
    if (!allChecked) return;
    setLoading(true);

    try {
      await apiClient.acknowledgeTerms();
      await refetchUser(); // Update local user state
      toast({
        title: "Welcome aboard!",
        description: "You're all set to start your wealth building journey.",
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Acknowledgement failed:', error);
      toast({
        title: "Something went wrong",
        description: error.message || "Failed to update your status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Before we begin...</CardTitle>
          <CardDescription>
            Please confirm that you match our investment philosophy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {TERMS.map((term, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <Checkbox 
                  id={`term-${index}`} 
                  checked={checkedItems[index]} 
                  onCheckedChange={() => handleCheck(index)}
                  className="mt-1"
                />
                <label 
                  htmlFor={`term-${index}`} 
                  className="text-sm leading-relaxed cursor-pointer select-none"
                >
                  {term}
                </label>
              </div>
            ))}
          </div>

          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleContinue} 
            disabled={!allChecked || loading}
          >
            {loading ? "Completing setup..." : "I Agree & Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Acknowledgement;
