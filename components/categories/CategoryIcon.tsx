import {
  Utensils, Car, Home, HeartPulse, Tv, ShoppingBag,
  BookOpen, Plane, PiggyBank, Wallet, Briefcase, Dumbbell,
  Music, Coffee, Gift, Ellipsis,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  utensils: Utensils,
  car: Car,
  home: Home,
  "heart-pulse": HeartPulse,
  tv: Tv,
  "shopping-bag": ShoppingBag,
  "book-open": BookOpen,
  plane: Plane,
  "piggy-bank": PiggyBank,
  wallet: Wallet,
  briefcase: Briefcase,
  dumbbell: Dumbbell,
  music: Music,
  coffee: Coffee,
  gift: Gift,
  ellipsis: Ellipsis,
};

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export const CategoryIcon = ({ name, className, color }: CategoryIconProps) => {
  const Icon = ICON_MAP[name] ?? Ellipsis;
  return <Icon className={className} style={color ? { color } : undefined} />;
};
