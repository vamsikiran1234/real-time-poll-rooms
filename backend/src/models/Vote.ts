import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  pollId: mongoose.Types.ObjectId;
  optionId: mongoose.Types.ObjectId;
  voterIp: string;
  fingerprintToken: string;
  createdAt: Date;
}

const voteSchema = new Schema<IVote>({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  optionId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  voterIp: {
    type: String,
    required: true
  },
  fingerprintToken: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

voteSchema.index({ pollId: 1, voterIp: 1 });
voteSchema.index({ pollId: 1, fingerprintToken: 1 });

export default mongoose.model<IVote>('Vote', voteSchema);
