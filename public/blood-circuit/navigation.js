// Visibility-graph routing around the arena's small set of rectangular obstacles.
function intersects(a,b,r){let lo=0,hi=1;for(const axis of ['x','z']){const delta=b[axis]-a[axis],min=r[axis+'0'],max=r[axis+'1'];if(Math.abs(delta)<1e-8){if(a[axis]<min||a[axis]>max)return false}else{let t0=(min-a[axis])/delta,t1=(max-a[axis])/delta;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false}}return hi>1e-5&&lo<1-1e-5}
export function routeAround(start,target,colliders,radius,height=0){
 const boxes=colliders.filter(c=>c.h>height+.1).map(c=>({x0:c.x-c.w/2-radius,x1:c.x+c.w/2+radius,z0:c.z-c.d/2-radius,z1:c.z+c.d/2+radius}));
 const clear=(a,b)=>!boxes.some(r=>intersects(a,b,r));let goal={x:target.x,z:target.z};
 // A target on top of cover is approached from an accessible edge.
 for(const r of boxes)if(goal.x>=r.x0&&goal.x<=r.x1&&goal.z>=r.z0&&goal.z<=r.z1){const edges=[{x:r.x0-.2,z:goal.z},{x:r.x1+.2,z:goal.z},{x:goal.x,z:r.z0-.2},{x:goal.x,z:r.z1+.2}];edges.sort((a,b)=>Math.hypot(a.x-start.x,a.z-start.z)-Math.hypot(b.x-start.x,b.z-start.z));goal=edges[0]}
 if(clear(start,goal))return [goal];
 const nodes=[{x:start.x,z:start.z},goal];for(const r of boxes)for(const x of [r.x0-.2,r.x1+.2])for(const z of [r.z0-.2,r.z1+.2])if(Math.abs(x)<51&&Math.abs(z)<51&&!boxes.some(o=>x>o.x0&&x<o.x1&&z>o.z0&&z<o.z1))nodes.push({x,z});
 const costs=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),done=new Set();costs[0]=0;
 for(let k=0;k<nodes.length;k++){let at=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(at<0||costs[i]<costs[at]))at=i;if(at<0||costs[at]===Infinity)break;if(at===1){const path=[];for(let i=1;i>0;i=prev[i])path.unshift(nodes[i]);return path}done.add(at);for(let i=1;i<nodes.length;i++)if(!done.has(i)&&clear(nodes[at],nodes[i])){const cost=costs[at]+Math.hypot(nodes[at].x-nodes[i].x,nodes[at].z-nodes[i].z);if(cost<costs[i]){costs[i]=cost;prev[i]=at}}}
 return [];
}
