import React from 'react'
import { Heart, MessageCircle, Repeat, Eye, Search, Upload, Home, ShoppingCart, PlusCircle, MessageSquare, User } from 'lucide-react'

export const Icons = {
  Heart: (props: any) => <Heart className="inline-block" {...props} />,
  Message: (props: any) => <MessageCircle className="inline-block" {...props} />,
  Repeat: (props: any) => <Repeat className="inline-block" {...props} />,
  Eye: (props: any) => <Eye className="inline-block" {...props} />
  ,
  Search: (props: any) => <Search className="inline-block" {...props} />,
  Upload: (props: any) => <Upload className="inline-block" {...props} />,
  Home: (props: any) => <Home className="inline-block" {...props} />,
  ShoppingCart: (props: any) => <ShoppingCart className="inline-block" {...props} />,
  PlusCircle: (props: any) => <PlusCircle className="inline-block" {...props} />,
  MessageSquare: (props: any) => <MessageSquare className="inline-block" {...props} />,
  User: (props: any) => <User className="inline-block" {...props} />
}

export default Icons
