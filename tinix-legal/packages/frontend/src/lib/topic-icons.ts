import {
  Landmark,
  ScrollText,
  Briefcase,
  Home,
  Users,
  Heart,
  Scale,
  Building2,
  Lightbulb,
  DollarSign,
  FileText,
  ShieldCheck,
  CreditCard,
  Globe,
  HardHat,
  Ship,
  Pill,
  Zap,
  Truck,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Maps the semantic icon-slug strings served by the backend taxonomies
 * (/api/case-law/topics, /api/procedures/categories, /api/healthcheck/schema
 * pillars, and radar-service industries) to their Lucide component, so the
 * taxonomy stays data-driven without emoji glyphs in the API response.
 */
const TOPIC_ICON_MAP: Record<string, LucideIcon> = {
  landmark: Landmark,
  'scroll-text': ScrollText,
  briefcase: Briefcase,
  home: Home,
  users: Users,
  heart: Heart,
  scale: Scale,
  'building-2': Building2,
  lightbulb: Lightbulb,
  'dollar-sign': DollarSign,
  'shield-check': ShieldCheck,
  'credit-card': CreditCard,
  globe: Globe,
  'hard-hat': HardHat,
  ship: Ship,
  pill: Pill,
  zap: Zap,
  truck: Truck,
  'graduation-cap': GraduationCap,
};

export function getTopicIcon(slug: string | undefined | null): LucideIcon {
  return (slug && TOPIC_ICON_MAP[slug]) || FileText;
}
